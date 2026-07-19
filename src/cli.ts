/**
 * CLI — install / wire agents / version.
 *
 *   hubdocs version
 *   hubdocs init                         # ↑↓ · Space · Enter
 *   hubdocs init --target=cursor,claude --yes
 */

import { createRequire } from 'node:module'
import { lstatSync, realpathSync, rmSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { packageRoot, defaultHubdocsRoot } from './config/docs-root.js'
import { installAgents, uninstallAgents, AGENT_IDS } from './install/agents.js'
import {
  installHarness,
  pruneHarness,
  statusHarness,
  uninstallHarness,
} from './install/harness.js'
import { discoverInstalls, ledgerPath, readLedger, removeLedger } from './install/ledger.js'
import { selectPrompt } from './install/prompt.js'

const require = createRequire(import.meta.url)

function pkgVersion(): string {
  try {
    const pkg = require(path.join(packageRoot(), 'package.json')) as { version?: string }
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function usage(): void {
  console.log(`hubdocs ${pkgVersion()}

Local MCP for arc42 × C4 docs hubs — index IDs, deps, orphans, links, route.

Wire agents:
  init [--target=claude,cursor,codex,opencode,hermes,gemini,antigravity,kiro,kilo|auto|all]
       [--location=local|global] [--yes] [--wsl]
       [--docs-root <path>] [--print-config <agent>] [--mcp-file <path>]
       # no flags → TTY multi-select (↑↓ · Space · Enter)
  install …   # deprecated alias → init

Install Cursor harness into the current project:
  harness install [--type=docs|consumer] [--project-root <path>] [--force]
  status [--project-root <path>]
  prune [--project-root <path>] [--yes]   # dry-run unless --yes

Uninstall (dry-run unless --yes; no flags → interactive scope menu):
  uninstall [--scope=repo|all-repos|mcp-local|mcp-global|cli|all] [--all]
            [--project-root <path>] [--discover <dir>]
            [--target=<agents>] [--location=local|global] [--keep-mcp] [--yes]
       # repo       current folder harness + local MCP
       # all-repos  every repo in the install ledger (+ --discover <dir>)
       # mcp-local / mcp-global   just the MCP entry
       # cli        CLI toolkit (~/.hubdocs + ~/.local/bin symlinks)
       # all        everything above, then the ledger

Other:
  version
  help

Docs: docs/INIT.md · docs/INSTALL.md · README.md

Env:
  HUBDOCS_ROOT   project docs hub; otherwise cwd if it has architecture/

Local wiring is the default. Global wiring is explicit and rootless unless
--docs-root is supplied; pass docsRoot to each MCP tool in rootless mode.
`)
  process.exit(1)
}

function arg(flag: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`${flag}=`))
  if (eq) return eq.slice(flag.length + 1) || undefined
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function has(flag: string): boolean {
  return process.argv.includes(flag)
}

async function runInitAgents(opts: { deprecatedAlias?: boolean } = {}): Promise<void> {
  if (opts.deprecatedAlias) {
    console.error('note: `install` is deprecated — use `hubdocs init`')
  }
  try {
    const result = await installAgents({
      target: arg('--target'),
      location: (arg('--location') as 'global' | 'local' | undefined) ?? undefined,
      yes: has('--yes'),
      useWsl: has('--wsl'),
      mcpFile: arg('--mcp-file'),
      printConfig: arg('--print-config'),
      docsRoot: arg('--docs-root'),
    })
    if (arg('--print-config')) return
    console.log(`Wired hubdocs → ${result.targets.join(', ') || '(none)'} (${result.location})`)
    for (const w of result.written) {
      console.log(`  ${w.agent}: ${w.path}`)
    }
    for (const s of result.skipped) console.log(`  skip: ${s}`)
    console.log(`Agents: ${AGENT_IDS.join(' | ')}`)
    const configuredRoot = arg('--docs-root') ?? defaultHubdocsRoot()
    console.log(`HUBDOCS_ROOT: ${configuredRoot || '(rootless global; use tool docsRoot)'}`)
    console.log('Restart agent(s), then try tool hubdocs_list_ids')
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

function runHarness(): void {
  const action = process.argv[3]
  if (action === 'status') {
    runHarnessStatus()
    return
  }
  if (action === 'prune') {
    runHarnessPrune()
    return
  }
  if (action !== 'install') usage()
  try {
    const type = arg('--type') ?? 'docs'
    if (type !== 'docs' && type !== 'consumer') {
      throw new Error('--type must be docs | consumer')
    }
    const result = installHarness({
      projectRoot: arg('--project-root'),
      force: has('--force'),
      type,
    })
    for (const file of result.written) console.log(`  wrote: ${file}`)
    for (const file of result.unchanged) console.log(`  unchanged: ${file}`)
    for (const file of result.skipped) console.log(`  skip customized: ${file} (use --force)`)
    for (const file of result.stale) console.log(`  stale: ${file}`)
    console.log(`manifest: ${result.manifest}`)
    console.log(
      `Harness: ${result.written.length} written, ${result.unchanged.length} unchanged, ${result.skipped.length} skipped`,
    )
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

function runHarnessStatus(): void {
  try {
    const result = statusHarness({ projectRoot: arg('--project-root') })
    if (!result.installed) {
      console.log(`Harness: not installed (${result.manifest})`)
      return
    }
    for (const file of result.modified) console.log(`  modified: ${file}`)
    for (const file of result.missing) console.log(`  missing: ${file}`)
    for (const file of result.stale) console.log(`  stale: ${file}`)
    for (const file of result.staleModified) console.log(`  stale modified: ${file}`)
    for (const file of result.staleMissing) console.log(`  stale missing: ${file}`)
    console.log(
      `Harness ${result.version}: ${result.current.length} current, ${result.modified.length} modified, ${result.missing.length} missing, ${result.stale.length + result.staleModified.length + result.staleMissing.length} stale`,
    )
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

function runHarnessPrune(): void {
  try {
    const result = pruneHarness({
      projectRoot: arg('--project-root'),
      yes: has('--yes'),
    })
    for (const file of result.wouldDelete) console.log(`  would delete: ${file}`)
    for (const file of result.deleted) console.log(`  deleted: ${file}`)
    for (const file of result.preservedModified) console.log(`  preserve modified: ${file}`)
    for (const file of result.missing) console.log(`  already missing: ${file}`)
    console.log(
      result.dryRun
        ? `Prune dry-run: ${result.wouldDelete.length} stale managed files (pass --yes to delete)`
        : `Pruned: ${result.deleted.length} stale managed files`,
    )
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

type UninstallScope = 'repo' | 'all-repos' | 'mcp-local' | 'mcp-global' | 'cli' | 'all'

const UNINSTALL_SCOPES: UninstallScope[] = [
  'repo',
  'all-repos',
  'mcp-local',
  'mcp-global',
  'cli',
  'all',
]

interface UninstallFlags {
  yes: boolean
  keepMcp: boolean
  target?: string
  location?: 'global' | 'local'
  projectRoot?: string
  discoverDir?: string
}

function cliLayout(): { installDir: string; binDir: string } {
  const installDir = process.env.HUBDOCS_INSTALL_DIR
    ? path.resolve(process.env.HUBDOCS_INSTALL_DIR)
    : path.join(os.homedir(), '.hubdocs')
  const binDir = process.env.HUBDOCS_BIN_DIR
    ? path.resolve(process.env.HUBDOCS_BIN_DIR)
    : path.join(os.homedir(), '.local', 'bin')
  return { installDir, binDir }
}

function lexists(file: string): boolean {
  try {
    lstatSync(file)
    return true
  } catch {
    return false
  }
}

function realOrSelf(file: string): string {
  try {
    return realpathSync(file)
  } catch {
    return file
  }
}

function removeCliToolkit(dryRun: boolean): {
  removed: string[]
  wouldRemove: string[]
  skipped: string[]
} {
  const { installDir, binDir } = cliLayout()
  const removed: string[] = []
  const wouldRemove: string[] = []
  const skipped: string[] = []
  const here = realOrSelf(process.cwd())
  const targets = [path.join(binDir, 'hubdocs'), path.join(binDir, 'hubdocs-mcp'), installDir]

  for (const target of targets) {
    if (!lexists(target)) continue
    if (target === installDir && realOrSelf(target) === here) {
      skipped.push(`${target} (running from here — remove manually)`)
      continue
    }
    if (dryRun) {
      wouldRemove.push(target)
      continue
    }
    try {
      rmSync(target, { recursive: true, force: true })
      removed.push(target)
    } catch (err) {
      skipped.push(`${target} (${err instanceof Error ? err.message : String(err)})`)
    }
  }
  return { removed, wouldRemove, skipped }
}

function repoTargets(flags: UninstallFlags): string[] {
  const set = new Set<string>(readLedger())
  if (flags.discoverDir) for (const repo of discoverInstalls(flags.discoverDir)) set.add(repo)
  return [...set]
}

function runScope(scope: UninstallScope, flags: UninstallFlags): void {
  const yes = flags.yes
  const cwd = flags.projectRoot ? path.resolve(flags.projectRoot) : process.cwd()

  const doRepoHarness = (root: string): void => {
    console.log(`repo: ${root}`)
    const harness = uninstallHarness({ projectRoot: root, yes })
    for (const file of harness.wouldDelete) console.log(`  would delete: ${file}`)
    for (const file of harness.deleted) console.log(`  deleted: ${file}`)
    for (const file of harness.preservedModified) console.log(`  preserve modified: ${file}`)
    if (harness.registry) console.log(`  registry: ${harness.registry}`)
    if (harness.manifestRemoved) console.log(`  manifest removed: ${harness.manifest}`)
  }

  const doMcp = (location: 'local' | 'global', root: string): void => {
    const agents = uninstallAgents({ target: flags.target ?? 'all', location, yes, cwd: root })
    if (!agents.removed.length) {
      console.log(`  mcp (${location}): no hubdocs entry`)
      return
    }
    for (const entry of agents.removed) {
      console.log(`  ${yes ? 'unwired' : 'would unwire'} (${location}): ${entry}`)
    }
  }

  const doCli = (): void => {
    const cli = removeCliToolkit(!yes)
    for (const file of cli.wouldRemove) console.log(`  would remove: ${file}`)
    for (const file of cli.removed) console.log(`  removed: ${file}`)
    for (const file of cli.skipped) console.log(`  skip: ${file}`)
  }

  switch (scope) {
    case 'repo':
      doRepoHarness(cwd)
      if (!flags.keepMcp) doMcp('local', cwd)
      break
    case 'all-repos': {
      const repos = repoTargets(flags)
      if (!repos.length) console.log('  (no registered repos — try --discover <dir>)')
      for (const root of repos) {
        doRepoHarness(root)
        if (!flags.keepMcp) doMcp('local', root)
      }
      break
    }
    case 'mcp-local':
      doMcp('local', cwd)
      break
    case 'mcp-global':
      doMcp('global', cwd)
      break
    case 'cli':
      doCli()
      break
    case 'all': {
      const repos = repoTargets(flags)
      for (const root of repos) {
        doRepoHarness(root)
        doMcp('local', root)
      }
      doMcp('global', cwd)
      doCli()
      if (yes) {
        if (removeLedger()) console.log(`  ledger removed: ${ledgerPath()}`)
      } else {
        console.log(`  would remove ledger: ${ledgerPath()}`)
      }
      break
    }
  }
}

async function runUninstall(): Promise<void> {
  const flags: UninstallFlags = {
    yes: has('--yes'),
    keepMcp: has('--keep-mcp'),
    target: arg('--target'),
    location: arg('--location') as 'global' | 'local' | undefined,
    projectRoot: arg('--project-root'),
    discoverDir: arg('--discover'),
  }

  try {
    let scope: UninstallScope
    const scopeArg = arg('--scope')
    if (has('--all')) {
      scope = 'all'
    } else if (scopeArg) {
      if (!UNINSTALL_SCOPES.includes(scopeArg as UninstallScope)) {
        throw new Error(`--scope must be one of: ${UNINSTALL_SCOPES.join(', ')}`)
      }
      scope = scopeArg as UninstallScope
    } else if (
      process.stdin.isTTY &&
      !flags.yes &&
      !flags.projectRoot &&
      !arg('--target') &&
      !arg('--location')
    ) {
      scope = await selectPrompt<UninstallScope>({
        message: 'hubdocs uninstall — what to remove?',
        defaultIndex: 0,
        choices: [
          { value: 'repo', name: 'Current repo harness + MCP (this folder)' },
          { value: 'all-repos', name: 'All registered repo harnesses (ledger)' },
          { value: 'mcp-local', name: 'Local MCP wiring (this folder’s agents)' },
          { value: 'mcp-global', name: 'Global MCP wiring (home agents)' },
          { value: 'cli', name: 'CLI toolkit (~/.hubdocs + ~/.local/bin)' },
          { value: 'all', name: 'All — remove everything' },
        ],
      })
    } else {
      scope = 'repo'
    }

    const interactive = process.stdin.isTTY && !flags.yes
    if (interactive) {
      console.log(`\nPreview (${scope}):`)
      runScope(scope, { ...flags, yes: false })
      const confirm = await selectPrompt<'yes' | 'no'>({
        message: `Apply uninstall (${scope})? This cannot be undone.`,
        defaultIndex: 1,
        choices: [
          { value: 'no', name: 'No — cancel' },
          { value: 'yes', name: 'Yes — remove now' },
        ],
      })
      if (confirm !== 'yes') {
        console.log('Cancelled.')
        return
      }
      console.log(`\nApplying (${scope}):`)
      runScope(scope, { ...flags, yes: true })
      console.log(`\nUninstalled (${scope}).`)
      return
    }

    runScope(scope, flags)
    console.log(
      flags.yes
        ? `\nUninstalled (${scope}).`
        : `\nDry-run (${scope}) — pass --yes to apply.`,
    )
  } catch (err) {
    if (err instanceof Error && err.message === 'cancelled') {
      console.log('\nCancelled.')
      return
    }
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

async function main(): Promise<void> {
  const cmd = process.argv[2]
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') usage()

  if (cmd === 'version' || cmd === '--version' || cmd === '-V') {
    console.log(`hubdocs ${pkgVersion()}`)
    console.log(`packageRoot ${packageRoot()}`)
    console.log(`HUBDOCS_ROOT ${defaultHubdocsRoot()}`)
    return
  }

  if (cmd === 'init') {
    await runInitAgents()
    return
  }

  if (cmd === 'install') {
    await runInitAgents({ deprecatedAlias: true })
    return
  }

  if (cmd === 'harness') {
    runHarness()
    return
  }

  if (cmd === 'status') {
    runHarnessStatus()
    return
  }

  if (cmd === 'prune') {
    runHarnessPrune()
    return
  }

  if (cmd === 'uninstall') {
    await runUninstall()
    return
  }

  usage()
}

main()
