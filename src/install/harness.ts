import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { packageRoot } from '../config/docs-root.js'
import { mergePlatformRepos } from './platform-repos.js'

export const HUBDOCS_OWNED_SKILLS = [
  'hubdocs',
  'architecture',
  'context',
  'containers',
  'component',
  'journey',
  'deployment',
  'decision',
  'cross-cutting',
  'dynamics',
] as const

export interface HarnessInstallResult {
  written: string[]
  unchanged: string[]
  skipped: string[]
  registry?: string
  platformRepos?: string
  mergedSkills?: string[]
  warnings?: string[]
}

function walk(root: string): string[] {
  if (!existsSync(root)) return []
  const out: string[] = []
  for (const name of readdirSync(root)) {
    const file = path.join(root, name)
    if (statSync(file).isDirectory()) out.push(...walk(file))
    else out.push(file)
  }
  return out
}

function mergeExtractRegistry(projectRoot: string): string {
  const source = path.join(
    packageRoot(),
    'harness',
    'cursor',
    'extracts',
    'extract-registry.hubdocs.json',
  )
  const target = path.join(projectRoot, '.cursor', 'extracts', 'extract-registry.json')
  const owned = JSON.parse(readFileSync(source, 'utf8')) as {
    version: number
    bundles: Record<string, string[]>
  }
  const current = existsSync(target)
    ? (JSON.parse(readFileSync(target, 'utf8')) as {
        version: number
        bundles: Record<string, string[]>
      })
    : { version: 1, bundles: {} }
  current.version = Math.max(current.version ?? 1, owned.version ?? 1)
  current.bundles = {
    ...current.bundles,
    ...owned.bundles,
  }
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(current, null, 2)}\n`, 'utf8')
  return target
}

/**
 * Sync Hubdocs-owned Cursor harness assets into a docs hub.
 * Skips package-local registry source files and preserves customized targets.
 */
export function installHarness(opts: {
  projectRoot?: string
  force?: boolean
} = {}): HarnessInstallResult {
  const projectRoot = path.resolve(opts.projectRoot ?? process.cwd())
  const sourceRoot = path.join(packageRoot(), 'harness', 'cursor')
  const result: HarnessInstallResult = { written: [], unchanged: [], skipped: [] }

  for (const source of walk(sourceRoot)) {
    const rel = path.relative(sourceRoot, source)
    if (rel === path.join('extracts', 'extract-registry.hubdocs.json')) continue
    const targetRel = path.join('.cursor', ...rel.split(path.sep))
    const target = path.join(projectRoot, targetRel)
    const content = readFileSync(source, 'utf8')

    if (existsSync(target)) {
      const current = readFileSync(target, 'utf8')
      if (current === content) {
        result.unchanged.push(target)
        continue
      }
      if (!opts.force) {
        result.skipped.push(target)
        continue
      }
    }

    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content, 'utf8')
    result.written.push(target)
  }

  result.registry = mergeExtractRegistry(projectRoot)
  const maps = mergePlatformRepos(projectRoot)
  result.platformRepos = maps.path
  result.mergedSkills = maps.mergedSkills
  result.warnings = maps.warnings
  return result
}
