/**
 * CLI — install / wire agents / version.
 *
 *   hubdocs version
 *   hubdocs init                         # ↑↓ · Space · Enter
 *   hubdocs init --target=cursor,claude --yes
 */

import { createRequire } from 'node:module'
import path from 'node:path'
import { packageRoot, defaultHubdocsRoot } from './config/docs-root.js'
import { installAgents, AGENT_IDS } from './install/agents.js'
import { installHarness, pruneHarness, statusHarness } from './install/harness.js'

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

  usage()
}

main()
