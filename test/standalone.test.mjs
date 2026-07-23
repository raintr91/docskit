import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

import {
  defaultDocskitRoot,
  resolveDocsRoot,
} from '../dist/config/docs-root.js'
import {
  buildMcpEntry,
  installAgents,
} from '../dist/install/agents.js'
import {
  INSTALL_MANIFEST_PATH,
  installHarness,
  pruneHarness,
  statusHarness,
} from '../dist/install/harness.js'
import {
  canonicalGitignorePattern,
  ensureGitignoreEntries,
  generatedTargets,
  removeGitignoreEntries,
} from '../dist/install/gitignore.js'
import {
  optionalToolkitInvocations,
  parseOptionalToolkits,
  resolveOptionalToolkits,
  runOptionalToolkits,
} from '../dist/install/optional.js'
import { indexIds, walkMdFiles, SCAN_MD_DIRS } from '../dist/scan/ids.js'
import { depsFromFiles, validateMdLinks } from '../dist/scan/links.js'
import { routeTopic } from '../dist/scan/route.js'

const originalCwd = process.cwd()
const originalRoot = process.env.DOCSKIT_ROOT

// Keep the install ledger out of the real ~/.local/state during tests.
process.env.DOCSKIT_STATE_DIR = mkdtempSync(path.join(os.tmpdir(), 'docskit-state-'))

function tempDir(name) {
  return mkdtempSync(path.join(os.tmpdir(), `docskit-${name}-`))
}

function hash(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

function makeHub(name) {
  const root = tempDir(name)
  const journeys = path.join(root, 'architecture', '06-runtime', 'journeys')
  const decisions = path.join(root, 'architecture', '09-decisions')
  mkdirSync(journeys, { recursive: true })
  mkdirSync(decisions, { recursive: true })
  writeFileSync(
    path.join(journeys, 'FLOW-login.md'),
    '# FLOW-login\n\nDepends on [ADR-001](../../09-decisions/ADR-001.md).\n',
  )
  writeFileSync(path.join(decisions, 'ADR-001.md'), '# ADR-001\n')
  return root
}

function withoutRootEnv(fn) {
  delete process.env.DOCSKIT_ROOT
  try {
    return fn()
  } finally {
    if (originalRoot === undefined) delete process.env.DOCSKIT_ROOT
    else process.env.DOCSKIT_ROOT = originalRoot
  }
}

test('standalone package behavior', async (t) => {
  await t.test('root precedence is explicit, env, cwd, then error', () => {
    const explicit = makeHub('explicit')
    const envRoot = makeHub('env')
    const cwdRoot = makeHub('cwd')

    process.env.DOCSKIT_ROOT = envRoot
    process.chdir(cwdRoot)
    assert.equal(resolveDocsRoot(explicit), explicit)
    assert.equal(resolveDocsRoot(), envRoot)
    delete process.env.DOCSKIT_ROOT
    assert.equal(resolveDocsRoot(), cwdRoot)
    assert.equal(defaultDocskitRoot(), cwdRoot)

    const empty = tempDir('empty')
    process.chdir(empty)
    assert.throws(
      () => resolveDocsRoot(),
      /docskit init/,
    )
    process.chdir(originalCwd)
  })

  await t.test('local entries require a hub and global entries are rootless by default', () => {
    const empty = tempDir('entry-empty')
    process.chdir(empty)
    withoutRootEnv(() => {
      assert.throws(() => buildMcpEntry({ location: 'local' }), /No docs hub found/)
      const globalEntry = buildMcpEntry({ location: 'global' })
      assert.equal(globalEntry.env, undefined)
    })

    const hub = makeHub('entry-explicit')
    const namedGlobal = buildMcpEntry({ location: 'global', docsRoot: hub })
    assert.equal(namedGlobal.env.DOCSKIT_ROOT, hub)
    process.chdir(originalCwd)
  })

  await t.test('two local hubs keep independent MCP roots', async () => {
    for (const name of ['one', 'two']) {
      const hub = makeHub(name)
      process.chdir(hub)
      const result = await installAgents({
        target: 'cursor',
        yes: true,
      })
      assert.equal(result.location, 'local')
      const config = JSON.parse(readFileSync(path.join(hub, '.cursor', 'mcp.json'), 'utf8'))
      assert.equal(config.mcpServers.docskit.env.DOCSKIT_ROOT, hub)
    }
    process.chdir(originalCwd)
  })

  await t.test('local init writes project configs for previously global-only agents', async () => {
    const hub = makeHub('local-agents')
    process.chdir(hub)
    const result = await installAgents({
      target: 'codex,hermes,antigravity',
      yes: true,
    })
    assert.equal(result.skipped.length, 0)
    assert.ok(existsSync(path.join(hub, '.codex', 'config.toml')))
    assert.ok(existsSync(path.join(hub, '.hermes', 'config.yaml')))
    assert.ok(existsSync(path.join(hub, '.gemini', 'config', 'mcp_config.json')))
    process.chdir(originalCwd)
  })

  await t.test('optional toolkit wizard supports skip, flags, and no hidden install', async () => {
    assert.equal(parseOptionalToolkits(undefined), undefined)
    assert.deepEqual(parseOptionalToolkits('none'), [])
    assert.deepEqual(parseOptionalToolkits('artifactgraph,artifactgraph'), ['artifactgraph'])
    assert.throws(() => parseOptionalToolkits('unknown'), /Unknown optional toolkit/)

    const skipped = await resolveOptionalToolkits({ interactive: false })
    assert.deepEqual(skipped, [])

    let prompted = false
    const selected = await resolveOptionalToolkits({
      interactive: true,
      prompts: {
        checkbox: async ({ message, choices }) => {
          prompted = true
          assert.match(message, /none = skip/)
          assert.deepEqual(
            choices.map((choice) => ({
              value: choice.value,
              checked: Boolean(choice.checked),
            })),
            [{ value: 'artifactgraph', checked: false }],
          )
          return ['artifactgraph']
        },
      },
    })
    assert.equal(prompted, true)
    assert.deepEqual(selected, ['artifactgraph'])

    const docsInvocation = optionalToolkitInvocations({
      selected,
      projectRoot: '/tmp/docs',
      target: 'cursor,claude',
      type: 'docs',
    })[0]
    assert.deepEqual(docsInvocation.args, [
      'init',
      '--target=cursor,claude',
      '--type=docs',
      '--location=local',
      '--yes',
    ])
    const consumerInvocation = optionalToolkitInvocations({
      selected,
      projectRoot: '/tmp/consumer',
      target: 'none',
      type: 'consumer',
    })[0]
    assert.ok(consumerInvocation.args.includes('--type=common'))

    const originalPath = process.env.PATH
    process.env.PATH = ''
    try {
      const unavailable = runOptionalToolkits([docsInvocation])
      assert.deepEqual(unavailable, {
        initialized: [],
        unavailable: ['artifactgraph'],
      })
    } finally {
      if (originalPath === undefined) delete process.env.PATH
      else process.env.PATH = originalPath
    }

    const hub = makeHub('optional-unavailable')
    const cli = path.resolve(originalCwd, 'bin', 'docskit.mjs')
    const cliResult = spawnSync(
      process.execPath,
      [
        cli,
        'init',
        '--target=none',
        '--type=docs',
        '--with=artifactgraph',
        '--yes',
      ],
      {
        cwd: hub,
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: '',
          DOCSKIT_STATE_DIR: process.env.DOCSKIT_STATE_DIR,
        },
      },
    )
    assert.equal(cliResult.status, 0, cliResult.stderr)
    assert.match(cliResult.stdout, /Optional toolkit unavailable: artifactgraph/)
    assert.ok(existsSync(path.join(hub, '.docskit', 'install-manifest.json')))
  })

  await t.test('generated local targets merge into .gitignore with DNA semantics', () => {
    const hub = makeHub('gitignore')
    writeFileSync(path.join(hub, '.gitignore'), 'node_modules/\r\n/.cursor/\r\n')
    const intended = generatedTargets({
      projectRoot: hub,
      location: 'local',
      written: [
        path.join(hub, '.cursor', 'mcp.json'),
        path.join(hub, '.codex', 'config.toml'),
        path.join(hub, '.hermes', 'config.yaml'),
      ],
      harnessInstalled: true,
    })
    assert.deepEqual(
      intended.map((e) => e.pattern).sort(),
      ['.codex/', '.cursor/', '.hermes/', '.docskit/'].sort(),
    )
    assert.equal(intended.find((e) => e.pattern === '.cursor/')?.shared, true)
    assert.equal(intended.find((e) => e.pattern === '.docskit/')?.shared, undefined)

    const added = ensureGitignoreEntries(
      hub,
      intended.map((e) => e.pattern),
    )
    assert.equal(added.changed, true)
    const content = readFileSync(path.join(hub, '.gitignore'), 'utf8')
    assert.match(content, /\r\n/)
    assert.equal(content.match(/\.cursor\//g)?.length, 1)
    assert.match(content, /\.docskit\//)
    assert.match(content, /\.codex\//)
    assert.match(content, /\.hermes\//)
    assert.doesNotMatch(content, /# >>> docskit generated files/)

    const again = ensureGitignoreEntries(
      hub,
      intended.map((e) => e.pattern),
    )
    assert.equal(again.changed, false)

    const removed = removeGitignoreEntries(hub, ['.docskit/', '.codex/', '.hermes/'])
    assert.equal(removed.changed, true)
    const after = readFileSync(path.join(hub, '.gitignore'), 'utf8')
    assert.match(after, /node_modules\//)
    assert.match(after, /\.cursor\//)
    assert.doesNotMatch(after, /\.docskit\//)
    assert.equal(canonicalGitignorePattern('/.cursor/'), '.cursor')
    assert.equal(canonicalGitignorePattern('.cursor'), '.cursor')
    assert.equal(canonicalGitignorePattern('.cursor/'), '.cursor')
  })

  await t.test('global location never claims home agent paths in repo .gitignore', () => {
    const hub = makeHub('gitignore-global')
    const intended = generatedTargets({
      projectRoot: hub,
      location: 'global',
      written: [path.join(os.homedir(), '.cursor', 'mcp.json')],
      harnessInstalled: true,
    })
    assert.deepEqual(
      intended.map((e) => ({ pattern: e.pattern, shared: Boolean(e.shared) })).sort((a, b) =>
        a.pattern.localeCompare(b.pattern),
      ),
      [
        { pattern: '.cursor/', shared: true },
        { pattern: '.docskit/', shared: false },
      ],
    )
  })

  await t.test('CLI init installs harness for the selected lane', () => {
    const hub = makeHub('cli-init')
    const cli = path.resolve(originalCwd, 'bin', 'docskit.mjs')
    const result = spawnSync(
      process.execPath,
      [cli, 'init', '--target=cursor', '--type=docs', '--yes'],
      {
        cwd: hub,
        encoding: 'utf8',
        env: { ...process.env, DOCSKIT_STATE_DIR: process.env.DOCSKIT_STATE_DIR },
      },
    )
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Harness \(docs\)/)
    assert.ok(existsSync(path.join(hub, '.cursor', 'mcp.json')))
    assert.ok(existsSync(path.join(hub, '.docskit', 'install-manifest.json')))
    const gitignore = readFileSync(path.join(hub, '.gitignore'), 'utf8')
    assert.match(gitignore, /\.cursor\//)
    assert.match(gitignore, /\.docskit\//)
    assert.doesNotMatch(gitignore, /# >>> docskit generated files/)
    const manifest = JSON.parse(
      readFileSync(path.join(hub, '.docskit', 'install-manifest.json'), 'utf8'),
    )
    assert.ok(Array.isArray(manifest.gitignore))
    assert.ok(manifest.gitignore.some((e) => e.pattern === '.cursor/' && e.shared === true))
    assert.ok(manifest.gitignore.some((e) => e.pattern === '.docskit/' && !e.shared))

    const second = spawnSync(
      process.execPath,
      [cli, 'init', '--target=cursor', '--type=docs', '--yes'],
      {
        cwd: hub,
        encoding: 'utf8',
        env: { ...process.env, DOCSKIT_STATE_DIR: process.env.DOCSKIT_STATE_DIR },
      },
    )
    assert.equal(second.status, 0, second.stderr)
    assert.match(second.stdout, /gitignore: unchanged/)
  })

  await t.test('multi-agent local init ignores only written agent paths', () => {
    const hub = makeHub('cli-multi')
    const cli = path.resolve(originalCwd, 'bin', 'docskit.mjs')
    const result = spawnSync(
      process.execPath,
      [cli, 'init', '--target=cursor,codex,hermes', '--type=docs', '--yes'],
      {
        cwd: hub,
        encoding: 'utf8',
        env: { ...process.env, DOCSKIT_STATE_DIR: process.env.DOCSKIT_STATE_DIR },
      },
    )
    assert.equal(result.status, 0, result.stderr)
    const gitignore = readFileSync(path.join(hub, '.gitignore'), 'utf8')
    assert.match(gitignore, /\.codex\//)
    assert.match(gitignore, /\.hermes\//)
    assert.doesNotMatch(gitignore, /\.kilocode\//)
    assert.doesNotMatch(gitignore, /\.kiro\//)
  })

  await t.test('status reports missing managed gitignore entries', () => {
    const hub = makeHub('gitignore-status')
    const intended = generatedTargets({
      projectRoot: hub,
      location: 'local',
      written: [path.join(hub, '.cursor', 'mcp.json')],
      harnessInstalled: true,
    })
    ensureGitignoreEntries(
      hub,
      intended.map((e) => e.pattern),
    )
    installHarness({
      projectRoot: hub,
      type: 'docs',
      gitignoreEntries: intended,
    })
    writeFileSync(path.join(hub, '.gitignore'), 'node_modules/\n')
    const status = statusHarness({ projectRoot: hub })
    assert.ok(status.gitignore.some((e) => e.pattern === '.docskit/' && e.status === 'missing'))
    assert.ok(status.gitignore.some((e) => e.pattern === '.cursor/' && e.status === 'missing'))
  })

  await t.test('explicit global wiring can stay rootless', async () => {
    const file = path.join(tempDir('global'), 'mcp.json')
    const result = await installAgents({
      mcpFile: file,
      location: 'global',
    })
    assert.equal(result.location, 'global')
    const config = JSON.parse(readFileSync(file, 'utf8'))
    assert.equal(config.mcpServers.docskit.env, undefined)
  })

  await t.test('external hub supports IDs, dependencies, links, and routes', () => {
    const hub = makeHub('external')
    const ids = indexIds(hub)
    assert.ok(ids.has('FLOW-login'))
    assert.ok(ids.has('ADR-001'))
    assert.deepEqual(depsFromFiles(ids.get('FLOW-login').files, 'FLOW-login'), ['ADR-001'])
    const files = walkMdFiles(hub, [...SCAN_MD_DIRS])
    assert.deepEqual(validateMdLinks(hub, files), [])
    assert.equal(routeTopic('login sequence')[0].path, 'architecture/06-runtime/journeys/')
  })

  await t.test('external hub passes the MCP tool smoke matrix', async () => {
    const hub = makeHub('mcp')
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.join(originalCwd, 'bin', 'docskit-mcp.mjs')],
      env: { ...process.env, DOCSKIT_ROOT: hub },
      stderr: 'pipe',
    })
    const client = new Client({ name: 'docskit-test', version: '1.0.0' })
    await client.connect(transport)
    try {
      const calls = [
        ['docskit_list_ids', {}],
        ['docskit_get_element', { id: 'FLOW-login' }],
        ['docskit_deps_of', { id: 'FLOW-login' }],
        ['docskit_dependents_of', { id: 'ADR-001' }],
        ['docskit_orphans', {}],
        ['docskit_validate_links', {}],
        ['docskit_route', { topic: 'login sequence' }],
        ['docskit_journeys', {}],
        ['docskit_layout', {}],
      ]
      for (const [name, args] of calls) {
        const result = await client.callTool({ name, arguments: args })
        assert.equal(result.isError, undefined, `${name} returned MCP error`)
        assert.ok(result.content.length > 0, `${name} returned no content`)
      }
    } finally {
      await client.close()
    }
  })

  await t.test('harness install syncs architecture family and protects customization', () => {
    const project = tempDir('harness')
    const manifestFile = path.join(project, ...INSTALL_MANIFEST_PATH.split('/'))
    assert.equal(existsSync(manifestFile), false)
    mkdirSync(path.join(project, '.cursor', 'extracts'), { recursive: true })
    writeFileSync(
      path.join(project, '.cursor', 'extracts', 'extract-registry.json'),
      `${JSON.stringify(
        {
          version: 1,
          bundles: {
            'foreign-bundle': ['.cursor/extracts/foreign.md'],
          },
        },
        null,
        2,
      )}\n`,
    )
    const first = installHarness({ projectRoot: project })
    assert.ok(first.written.length >= 18, `expected architecture family sync, got ${first.written.length}`)
    assert.ok(
      first.written.some((file) => file.endsWith(`${path.sep}architecture${path.sep}SKILL.md`)),
    )
    assert.ok(first.written.some((file) => file.endsWith(`${path.sep}tpl-journey.md`)))
    assert.ok(first.registry)
    assert.equal(first.manifest, manifestFile)
    const firstManifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    assert.deepEqual(
      {
        package: firstManifest.package,
        schema: firstManifest.schema,
        toolApi: firstManifest.toolApi,
        harnessApi: firstManifest.harnessApi,
        version: firstManifest.version,
      },
      {
        package: '@platform/docskit',
        schema: 1,
        toolApi: 1,
        harnessApi: 1,
        version: JSON.parse(readFileSync(path.join(originalCwd, 'package.json'), 'utf8')).version,
      },
    )
    assert.ok(Object.keys(firstManifest.hashes).length >= 18)
    assert.equal(firstManifest.hashes['.cursor/extracts/extract-registry.json'], undefined)
    assert.equal(firstManifest.hashes['platform-repos.json'], undefined)
    const schemaRel = '.cursor/schemas/docskit/missing-optional-event.schema.json'
    const schemaTargets = Object.keys(firstManifest.hashes).filter((rel) =>
      rel.endsWith('/missing-optional-event.schema.json'),
    )
    assert.deepEqual(schemaTargets, [schemaRel])
    const installedSchema = JSON.parse(
      readFileSync(path.join(project, ...schemaRel.split('/')), 'utf8'),
    )
    assert.equal(installedSchema.properties.event.const, 'docskit.missing-optional')
    assert.equal(installedSchema.properties.package.const, '@platform/docskit')
    assert.deepEqual(installedSchema.properties.metrics.required, ['fileReads', 'contextBytes'])
    assert.equal(installedSchema.properties.metrics.additionalProperties, false)
    const registry = JSON.parse(readFileSync(first.registry[0], 'utf8'))
    assert.ok(registry.bundles['architecture-core'])
    // Docskit never writes Platform DNA-owned project maps.
    assert.equal(first.platformRepos, undefined)
    assert.equal(existsSync(path.join(project, 'platform-repos.json')), false)
    assert.ok(registry.bundles.docskit)
    assert.deepEqual(registry.bundles['foreign-bundle'], ['.cursor/extracts/foreign.md'])

    const second = installHarness({ projectRoot: project })
    assert.equal(second.written.length, 0)
    assert.ok(second.unchanged.length >= 18)

    const skill = path.join(project, '.cursor', 'skills', 'docskit', 'SKILL.md')
    const skillRel = '.cursor/skills/docskit/SKILL.md'
    const packagedSkill = readFileSync(skill, 'utf8')
    const oldPackagedSkill = '# previous package copy\n'
    const upgradeLedger = JSON.parse(readFileSync(manifestFile, 'utf8'))
    upgradeLedger.hashes[skillRel] = hash(oldPackagedSkill)
    writeFileSync(manifestFile, `${JSON.stringify(upgradeLedger, null, 2)}\n`)
    writeFileSync(skill, oldPackagedSkill)
    const managedUpgrade = installHarness({ projectRoot: project })
    assert.ok(managedUpgrade.written.includes(skill))
    assert.equal(readFileSync(skill, 'utf8'), packagedSkill)

    writeFileSync(skill, '# customized\n')
    const protectedRun = installHarness({ projectRoot: project })
    assert.deepEqual(protectedRun.skipped, [skill])
    assert.equal(readFileSync(skill, 'utf8'), '# customized\n')
    assert.deepEqual(statusHarness({ projectRoot: project }).modified, [skill])
    installHarness({ projectRoot: project, force: true })
    assert.notEqual(readFileSync(skill, 'utf8'), '# customized\n')

    for (const owned of [
      'architecture',
      'context',
      'containers',
      'component',
      'journey',
      'deployment',
      'decision',
      'cross-cutting',
      'dynamics',
      'docskit',
    ]) {
      const body = readFileSync(
        path.join(project, '.cursor', 'skills', owned, 'SKILL.md'),
        'utf8',
      )
      if (owned === 'dynamics') continue
      assert.match(body, /Accelerators \(optional\)|never blocks|never requires ArtifactGraph/i)
    }
    const installedRule = readFileSync(
      path.join(project, '.cursor', 'rules', 'docskit.mdc'),
      'utf8',
    )
    const installedDocskitSkill = readFileSync(
      path.join(project, '.cursor', 'skills', 'docskit', 'SKILL.md'),
      'utf8',
    )
    for (const body of [installedRule, installedDocskitSkill]) {
      assert.match(body, /docskit\.missing-optional/)
      assert.match(body, /exactly one/)
      assert.match(body, /deduplicate\s+retries/i)
      assert.match(body, /actual `fileReads` and `contextBytes`/)
      assert.match(body, /never\s+(?:estimate\s+)?tokens|never\s+token estimates/i)
    }

    const retiredRel = '.cursor/skills/retired/SKILL.md'
    const retiredModifiedRel = '.cursor/skills/retired-modified/SKILL.md'
    const retired = path.join(project, ...retiredRel.split('/'))
    const retiredModified = path.join(project, ...retiredModifiedRel.split('/'))
    const retiredBody = '# retired package asset\n'
    const modifiedBody = '# another retired package asset\n'
    mkdirSync(path.dirname(retired), { recursive: true })
    mkdirSync(path.dirname(retiredModified), { recursive: true })
    writeFileSync(retired, retiredBody)
    writeFileSync(retiredModified, modifiedBody)
    const upgradeManifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    upgradeManifest.hashes[retiredRel] = hash(retiredBody)
    upgradeManifest.hashes[retiredModifiedRel] = hash(modifiedBody)
    writeFileSync(manifestFile, `${JSON.stringify(upgradeManifest, null, 2)}\n`)

    const upgraded = installHarness({ projectRoot: project })
    assert.deepEqual(upgraded.stale.sort(), [retired, retiredModified].sort())
    const staleManifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    assert.equal(staleManifest.hashes[retiredRel], undefined)
    assert.equal(staleManifest.stale[retiredRel].hash, hash(retiredBody))
    assert.equal(staleManifest.stale[retiredRel].sinceVersion, JSON.parse(readFileSync(path.join(originalCwd, 'package.json'), 'utf8')).version)
    installHarness({ projectRoot: project })
    const retainedManifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    assert.deepEqual(retainedManifest.stale, staleManifest.stale)

    writeFileSync(retiredModified, '# locally modified after retirement\n')
    const unmanaged = path.join(project, '.cursor', 'skills', 'unmanaged', 'SKILL.md')
    mkdirSync(path.dirname(unmanaged), { recursive: true })
    writeFileSync(unmanaged, '# unmanaged\n')
    const registryBeforePrune = readFileSync(first.registry[0], 'utf8')
    const lifecycleStatus = statusHarness({ projectRoot: project })
    assert.deepEqual(lifecycleStatus.stale, [retired])
    assert.deepEqual(lifecycleStatus.staleModified, [retiredModified])

    const preview = pruneHarness({ projectRoot: project })
    assert.equal(preview.dryRun, true)
    assert.deepEqual(preview.wouldDelete, [retired])
    assert.deepEqual(preview.preservedModified, [retiredModified])
    assert.equal(existsSync(retired), true)

    const applied = pruneHarness({ projectRoot: project, yes: true })
    assert.deepEqual(applied.deleted, [retired])
    assert.deepEqual(applied.preservedModified, [retiredModified])
    assert.equal(existsSync(retired), false)
    assert.equal(readFileSync(retiredModified, 'utf8'), '# locally modified after retirement\n')
    assert.equal(readFileSync(unmanaged, 'utf8'), '# unmanaged\n')
    assert.equal(readFileSync(first.registry[0], 'utf8'), registryBeforePrune)
    assert.equal(existsSync(path.join(project, 'platform-repos.json')), false)
    const prunedManifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    assert.equal(prunedManifest.stale[retiredRel], undefined)
    assert.deepEqual(prunedManifest.stale[retiredModifiedRel], staleManifest.stale[retiredModifiedRel])

    for (const args of [
      ['status', '--project-root', project],
      ['prune', '--project-root', project],
      ['prune', '--project-root', project, '--yes'],
      ['harness', 'status', '--project-root', project],
    ]) {
      const cli = spawnSync(process.execPath, [path.join(originalCwd, 'bin', 'docskit.mjs'), ...args], {
        cwd: originalCwd,
        encoding: 'utf8',
      })
      assert.equal(cli.status, 0, `${args.join(' ')}\n${cli.stderr}`)
      assert.match(cli.stdout, /Harness|Prune|Pruned/)
    }
    assert.equal(existsSync(retiredModified), true)
    assert.equal(readFileSync(unmanaged, 'utf8'), '# unmanaged\n')
  })

  await t.test('harness rejects incompatible and escaping manifests', () => {
    const project = tempDir('harness-validation')
    installHarness({ projectRoot: project })
    const file = path.join(project, ...INSTALL_MANIFEST_PATH.split('/'))
    const valid = JSON.parse(readFileSync(file, 'utf8'))

    writeFileSync(file, `${JSON.stringify({ ...valid, package: '@other/package' }, null, 2)}\n`)
    assert.throws(
      () => statusHarness({ projectRoot: project }),
      /Incompatible Docskit install manifest/,
    )

    const escaping = {
      ...valid,
      hashes: { ...valid.hashes, '../outside.md': hash('outside') },
    }
    writeFileSync(file, `${JSON.stringify(escaping, null, 2)}\n`)
    assert.throws(
      () => statusHarness({ projectRoot: project }),
      /Invalid managed harness path/,
    )

    const linkedProject = tempDir('harness-symlink')
    const outside = tempDir('harness-outside')
    symlinkSync(outside, path.join(linkedProject, '.docskit'), 'dir')
    assert.throws(
      () => installHarness({ projectRoot: linkedProject }),
      /escapes project root through a symlink/,
    )
    assert.equal(existsSync(path.join(outside, 'install-manifest.json')), false)
  })

  await t.test('consumer harness syncs only lightweight Docskit assets', () => {
    const project = tempDir('harness-consumer')
    const installed = installHarness({ projectRoot: project, type: 'consumer' })

    assert.ok(existsSync(path.join(project, '.cursor', 'skills', 'docskit', 'SKILL.md')))
    assert.ok(existsSync(path.join(project, '.cursor', 'rules', 'docskit.mdc')))
    assert.ok(
      existsSync(
        path.join(project, '.cursor', 'schemas', 'docskit', 'missing-optional-event.schema.json'),
      ),
    )
    assert.equal(
      existsSync(path.join(project, '.cursor', 'skills', 'architecture', 'SKILL.md')),
      false,
    )
    const registry = JSON.parse(readFileSync(installed.registry[0], 'utf8'))
    assert.deepEqual(Object.keys(registry.bundles), ['docskit'])
  })

  await t.test('missing ArtifactGraph keeps targeted local Docskit behavior available', () => {
    const pkg = JSON.parse(readFileSync(path.join(originalCwd, 'package.json'), 'utf8'))
    const mcpPackage = JSON.parse(readFileSync(path.join(originalCwd, 'mcp-package.json'), 'utf8'))
    assert.ok(mcpPackage.optional.includes('@platform/artifactgraph'))
    assert.equal(pkg.dependencies?.['@platform/artifactgraph'], undefined)

    const hub = makeHub('without-artifactgraph')
    const installed = installHarness({ projectRoot: hub })
    assert.ok(
      installed.written.includes(
        path.join(hub, '.cursor', 'schemas', 'docskit', 'missing-optional-event.schema.json'),
      ),
    )
    assert.ok(indexIds(hub).has('FLOW-login'))
    assert.equal(routeTopic('login sequence')[0].path, 'architecture/06-runtime/journeys/')
  })

  await t.test('package tarball excludes platform topology and includes harness', () => {
    const packed = spawnSync(
      'npm',
      ['pack', '--dry-run', '--json', '--ignore-scripts'],
      { cwd: originalCwd, encoding: 'utf8' },
    )
    assert.equal(packed.status, 0, packed.stderr)
    const report = JSON.parse(packed.stdout)[0]
    const names = report.files.map((file) => file.path)
    assert.equal(names.includes('platform-repos.json'), false)
    assert.equal(names.some((name) => name.startsWith('docs/handoffs/')), false)
    assert.ok(names.includes('harness/cursor/skills/docskit/SKILL.md'))
    assert.ok(names.includes('harness/cursor/skills/architecture/SKILL.md'))
    assert.ok(names.includes('harness/cursor/extracts/architecture-core.md'))
    assert.equal(
      names.filter(
        (name) =>
          name === 'harness/cursor/schemas/docskit/missing-optional-event.schema.json',
      ).length,
      1,
    )
    assert.ok(names.includes('mcp-package.json'))
  })
})
