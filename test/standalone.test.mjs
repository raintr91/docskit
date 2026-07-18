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
  defaultHubdocsRoot,
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
import { indexIds, walkMdFiles, SCAN_MD_DIRS } from '../dist/scan/ids.js'
import { depsFromFiles, validateMdLinks } from '../dist/scan/links.js'
import { routeTopic } from '../dist/scan/route.js'

const originalCwd = process.cwd()
const originalRoot = process.env.HUBDOCS_ROOT

function tempDir(name) {
  return mkdtempSync(path.join(os.tmpdir(), `hubdocs-${name}-`))
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
  delete process.env.HUBDOCS_ROOT
  try {
    return fn()
  } finally {
    if (originalRoot === undefined) delete process.env.HUBDOCS_ROOT
    else process.env.HUBDOCS_ROOT = originalRoot
  }
}

test('standalone package behavior', async (t) => {
  await t.test('root precedence is explicit, env, cwd, then error', () => {
    const explicit = makeHub('explicit')
    const envRoot = makeHub('env')
    const cwdRoot = makeHub('cwd')

    process.env.HUBDOCS_ROOT = envRoot
    process.chdir(cwdRoot)
    assert.equal(resolveDocsRoot(explicit), explicit)
    assert.equal(resolveDocsRoot(), envRoot)
    delete process.env.HUBDOCS_ROOT
    assert.equal(resolveDocsRoot(), cwdRoot)
    assert.equal(defaultHubdocsRoot(), cwdRoot)

    const empty = tempDir('empty')
    process.chdir(empty)
    assert.throws(
      () => resolveDocsRoot(),
      /hubdocs init --location=local/,
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
    assert.equal(namedGlobal.env.HUBDOCS_ROOT, hub)
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
      assert.equal(config.mcpServers.hubdocs.env.HUBDOCS_ROOT, hub)
    }
    process.chdir(originalCwd)
  })

  await t.test('explicit global wiring can stay rootless', async () => {
    const file = path.join(tempDir('global'), 'mcp.json')
    const result = await installAgents({
      mcpFile: file,
      location: 'global',
    })
    assert.equal(result.location, 'global')
    const config = JSON.parse(readFileSync(file, 'utf8'))
    assert.equal(config.mcpServers.hubdocs.env, undefined)
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
      args: [path.join(originalCwd, 'bin', 'hubdocs-mcp.mjs')],
      env: { ...process.env, HUBDOCS_ROOT: hub },
      stderr: 'pipe',
    })
    const client = new Client({ name: 'hubdocs-test', version: '1.0.0' })
    await client.connect(transport)
    try {
      const calls = [
        ['hubdocs_list_ids', {}],
        ['hubdocs_get_element', { id: 'FLOW-login' }],
        ['hubdocs_deps_of', { id: 'FLOW-login' }],
        ['hubdocs_dependents_of', { id: 'ADR-001' }],
        ['hubdocs_orphans', {}],
        ['hubdocs_validate_links', {}],
        ['hubdocs_route', { topic: 'login sequence' }],
        ['hubdocs_journeys', {}],
        ['hubdocs_layout', {}],
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
        package: '@platform/hubdocs',
        schema: 1,
        toolApi: 1,
        harnessApi: 1,
        version: '1.0.2',
      },
    )
    assert.ok(Object.keys(firstManifest.hashes).length >= 18)
    assert.equal(firstManifest.hashes['.cursor/extracts/extract-registry.json'], undefined)
    assert.equal(firstManifest.hashes['platform-repos.json'], undefined)
    const schemaRel = '.cursor/schemas/hubdocs/missing-optional-event.schema.json'
    const schemaTargets = Object.keys(firstManifest.hashes).filter((rel) =>
      rel.endsWith('/missing-optional-event.schema.json'),
    )
    assert.deepEqual(schemaTargets, [schemaRel])
    const installedSchema = JSON.parse(
      readFileSync(path.join(project, ...schemaRel.split('/')), 'utf8'),
    )
    assert.equal(installedSchema.properties.event.const, 'hubdocs.missing-optional')
    assert.equal(installedSchema.properties.package.const, '@platform/hubdocs')
    assert.deepEqual(installedSchema.properties.metrics.required, ['fileReads', 'contextBytes'])
    assert.equal(installedSchema.properties.metrics.additionalProperties, false)
    const registry = JSON.parse(readFileSync(first.registry, 'utf8'))
    assert.ok(registry.bundles['architecture-core'])
    // Hubdocs never writes Platform DNA-owned project maps.
    assert.equal(first.platformRepos, undefined)
    assert.equal(existsSync(path.join(project, 'platform-repos.json')), false)
    assert.ok(registry.bundles.hubdocs)
    assert.deepEqual(registry.bundles['foreign-bundle'], ['.cursor/extracts/foreign.md'])

    const second = installHarness({ projectRoot: project })
    assert.equal(second.written.length, 0)
    assert.ok(second.unchanged.length >= 18)

    const skill = path.join(project, '.cursor', 'skills', 'hubdocs', 'SKILL.md')
    const skillRel = '.cursor/skills/hubdocs/SKILL.md'
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
      'hubdocs',
    ]) {
      const body = readFileSync(
        path.join(project, '.cursor', 'skills', owned, 'SKILL.md'),
        'utf8',
      )
      if (owned === 'dynamics') continue
      assert.match(body, /Accelerators \(optional\)|never blocks|never requires ArtifactGraph/i)
    }
    const installedRule = readFileSync(
      path.join(project, '.cursor', 'rules', 'hubdocs.mdc'),
      'utf8',
    )
    const installedHubdocsSkill = readFileSync(
      path.join(project, '.cursor', 'skills', 'hubdocs', 'SKILL.md'),
      'utf8',
    )
    for (const body of [installedRule, installedHubdocsSkill]) {
      assert.match(body, /hubdocs\.missing-optional/)
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
    assert.equal(staleManifest.stale[retiredRel].sinceVersion, '1.0.2')
    installHarness({ projectRoot: project })
    const retainedManifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
    assert.deepEqual(retainedManifest.stale, staleManifest.stale)

    writeFileSync(retiredModified, '# locally modified after retirement\n')
    const unmanaged = path.join(project, '.cursor', 'skills', 'unmanaged', 'SKILL.md')
    mkdirSync(path.dirname(unmanaged), { recursive: true })
    writeFileSync(unmanaged, '# unmanaged\n')
    const registryBeforePrune = readFileSync(first.registry, 'utf8')
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
    assert.equal(readFileSync(first.registry, 'utf8'), registryBeforePrune)
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
      const cli = spawnSync(process.execPath, [path.join(originalCwd, 'bin', 'hubdocs.mjs'), ...args], {
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
      /Incompatible Hubdocs install manifest/,
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
    symlinkSync(outside, path.join(linkedProject, '.hubdocs'), 'dir')
    assert.throws(
      () => installHarness({ projectRoot: linkedProject }),
      /escapes project root through a symlink/,
    )
    assert.equal(existsSync(path.join(outside, 'install-manifest.json')), false)
  })

  await t.test('missing ArtifactGraph keeps targeted local Hubdocs behavior available', () => {
    const pkg = JSON.parse(readFileSync(path.join(originalCwd, 'package.json'), 'utf8'))
    const mcpPackage = JSON.parse(readFileSync(path.join(originalCwd, 'mcp-package.json'), 'utf8'))
    assert.ok(mcpPackage.optional.includes('@platform/artifactgraph'))
    assert.equal(pkg.dependencies?.['@platform/artifactgraph'], undefined)

    const hub = makeHub('without-artifactgraph')
    const installed = installHarness({ projectRoot: hub })
    assert.ok(
      installed.written.includes(
        path.join(hub, '.cursor', 'schemas', 'hubdocs', 'missing-optional-event.schema.json'),
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
    assert.ok(names.includes('harness/cursor/skills/hubdocs/SKILL.md'))
    assert.ok(names.includes('harness/cursor/skills/architecture/SKILL.md'))
    assert.ok(names.includes('harness/cursor/extracts/architecture-core.md'))
    assert.equal(
      names.filter(
        (name) =>
          name === 'harness/cursor/schemas/hubdocs/missing-optional-event.schema.json',
      ).length,
      1,
    )
    assert.ok(names.includes('mcp-package.json'))
  })
})
