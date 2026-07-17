import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
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
import { installHarness } from '../dist/install/harness.js'
import { indexIds, walkMdFiles, SCAN_MD_DIRS } from '../dist/scan/ids.js'
import { depsFromFiles, validateMdLinks } from '../dist/scan/links.js'
import { routeTopic } from '../dist/scan/route.js'

const originalCwd = process.cwd()
const originalRoot = process.env.HUBDOCS_ROOT

function tempDir(name) {
  return mkdtempSync(path.join(os.tmpdir(), `hubdocs-${name}-`))
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

  await t.test('harness install is idempotent and protects customization', () => {
    const project = tempDir('harness')
    const first = installHarness({ projectRoot: project })
    assert.equal(first.written.length, 3)
    const second = installHarness({ projectRoot: project })
    assert.equal(second.unchanged.length, 3)

    const skill = path.join(project, '.cursor', 'skills', 'hubdocs', 'SKILL.md')
    writeFileSync(skill, '# customized\n')
    const protectedRun = installHarness({ projectRoot: project })
    assert.deepEqual(protectedRun.skipped, [skill])
    installHarness({ projectRoot: project, force: true })
    assert.notEqual(readFileSync(skill, 'utf8'), '# customized\n')
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
  })
})
