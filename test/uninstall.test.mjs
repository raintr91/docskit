import assert from 'node:assert/strict'
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

// Isolate the install ledger so tests never touch the real ~/.local/state.
process.env.HUBDOCS_STATE_DIR = mkdtempSync(path.join(os.tmpdir(), 'hubdocs-state-'))

const { uninstallAgents } = await import('../dist/install/agents.js')
const { INSTALL_MANIFEST_PATH, installHarness, statusHarness, uninstallHarness } = await import(
  '../dist/install/harness.js'
)
const { discoverInstalls, ledgerPath, readLedger } = await import('../dist/install/ledger.js')

const originalCwd = process.cwd()

function tempDir(name) {
  return mkdtempSync(path.join(os.tmpdir(), `hubdocs-uninstall-${name}-`))
}

test('uninstall dry-run lists files but changes nothing', () => {
  const root = tempDir('dry')
  const install = installHarness({ projectRoot: root, type: 'docs' })
  assert.ok(install.written.length > 0)
  assert.ok(existsSync(path.join(root, ...INSTALL_MANIFEST_PATH.split('/'))))

  const dry = uninstallHarness({ projectRoot: root })
  assert.equal(dry.dryRun, true)
  assert.ok(dry.wouldDelete.length > 0)
  assert.equal(dry.deleted.length, 0)
  assert.equal(dry.manifestRemoved, false)
  // manifest + every managed file still present
  assert.ok(existsSync(path.join(root, ...INSTALL_MANIFEST_PATH.split('/'))))
  for (const file of install.written) assert.ok(existsSync(file))
})

test('uninstall --yes removes owned files and manifest', () => {
  const root = tempDir('apply')
  const install = installHarness({ projectRoot: root, type: 'docs' })
  const before = statusHarness({ projectRoot: root })
  assert.equal(before.installed, true)

  const result = uninstallHarness({ projectRoot: root, yes: true })
  assert.equal(result.dryRun, false)
  assert.ok(result.deleted.length > 0)
  assert.equal(result.manifestRemoved, true)

  for (const file of install.written) assert.equal(existsSync(file), false)
  assert.equal(existsSync(path.join(root, ...INSTALL_MANIFEST_PATH.split('/'))), false)
  // .hubdocs dir pruned
  assert.equal(existsSync(path.join(root, '.hubdocs')), false)

  const after = statusHarness({ projectRoot: root })
  assert.equal(after.installed, false)
})

test('uninstall preserves member-modified files and reports them', () => {
  const root = tempDir('modified')
  const install = installHarness({ projectRoot: root, type: 'docs' })
  const victim = install.written[0]
  writeFileSync(victim, `${readFileSync(victim, 'utf8')}\n<!-- member edit -->\n`)

  const result = uninstallHarness({ projectRoot: root, yes: true })
  assert.ok(result.preservedModified.includes(victim))
  assert.equal(existsSync(victim), true)
  assert.equal(result.deleted.includes(victim), false)
})

test('uninstall un-merges only hubdocs bundles from a shared registry', () => {
  const root = tempDir('registry')
  installHarness({ projectRoot: root, type: 'docs' })
  const registry = path.join(root, '.cursor', 'extracts', 'extract-registry.json')
  assert.ok(existsSync(registry))
  // simulate another toolkit's bundle sharing the file
  const doc = JSON.parse(readFileSync(registry, 'utf8'))
  doc.bundles = { ...doc.bundles, 'other-toolkit': ['x.md'] }
  writeFileSync(registry, `${JSON.stringify(doc, null, 2)}\n`)

  const result = uninstallHarness({ projectRoot: root, yes: true })
  assert.ok(result.registry)
  assert.ok(existsSync(registry), 'registry kept because another bundle remains')
  const after = JSON.parse(readFileSync(registry, 'utf8'))
  assert.deepEqual(Object.keys(after.bundles), ['other-toolkit'])
})

test('install records the repo in the ledger; uninstall rewrites the file to forget it', () => {
  const root = tempDir('ledger')
  const other = tempDir('ledger-keep')
  installHarness({ projectRoot: root, type: 'docs' })
  installHarness({ projectRoot: other, type: 'docs' })
  assert.ok(readLedger().includes(root), 'ledger should list the installed repo')

  uninstallHarness({ projectRoot: root, yes: true })
  // assert the persisted file (not just the pruned view) dropped the entry
  const raw = JSON.parse(readFileSync(ledgerPath(), 'utf8'))
  assert.equal(raw.repos.includes(root), false, 'ledger file should no longer contain it')
  assert.ok(raw.repos.includes(other), 'other repo entry preserved')
})

test('discoverInstalls finds repos carrying a hubdocs manifest', () => {
  const base = tempDir('discover')
  const repo = path.join(base, 'nested', 'my-repo')
  mkdirSync(repo, { recursive: true })
  installHarness({ projectRoot: repo, type: 'docs' })

  const found = discoverInstalls(base)
  assert.ok(
    found.some((p) => p === repo || existsSync(path.join(p, ...INSTALL_MANIFEST_PATH.split('/')))),
    'discover should locate the nested manifest',
  )
})

test('uninstallAgents strips the hubdocs MCP entry (cursor local)', () => {
  const root = tempDir('mcp')
  const cursorDir = path.join(root, '.cursor')
  mkdirSync(cursorDir, { recursive: true })
  const mcpFile = path.join(cursorDir, 'mcp.json')
  writeFileSync(
    mcpFile,
    `${JSON.stringify(
      { mcpServers: { hubdocs: { command: 'node', args: ['x'] }, keep: { command: 'k' } } },
      null,
      2,
    )}\n`,
  )

  process.chdir(root)
  try {
    const dry = uninstallAgents({ target: 'cursor', location: 'local' })
    assert.equal(dry.dryRun, true)
    assert.ok(dry.removed.some((r) => r.startsWith('cursor:')))
    assert.ok('hubdocs' in JSON.parse(readFileSync(mcpFile, 'utf8')).mcpServers)

    const applied = uninstallAgents({ target: 'cursor', location: 'local', yes: true })
    assert.ok(applied.removed.some((r) => r.startsWith('cursor:')))
    const parsed = JSON.parse(readFileSync(mcpFile, 'utf8'))
    assert.equal('hubdocs' in parsed.mcpServers, false)
    assert.equal('keep' in parsed.mcpServers, true)

    const again = uninstallAgents({ target: 'cursor', location: 'local', yes: true })
    assert.ok(again.absent.some((a) => a.startsWith('cursor:')))
  } finally {
    process.chdir(originalCwd)
  }
})
