import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { packageRoot } from '../config/docs-root.js'
import { mergePlatformRepos } from './platform-repos.js'

export const INSTALL_MANIFEST_PATH = '.hubdocs/install-manifest.json'
export const INSTALL_MANIFEST_SCHEMA = 1

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

export interface StaleHarnessAsset {
  hash: string
  sinceVersion: string
}

export interface HarnessInstallManifest {
  package: string
  schema: number
  toolApi: number
  harnessApi: number
  version: string
  hashes: Record<string, string>
  stale: Record<string, StaleHarnessAsset>
}

export interface HarnessInstallResult {
  written: string[]
  unchanged: string[]
  skipped: string[]
  stale: string[]
  manifest: string
  registry?: string
  platformRepos?: string
  mergedSkills?: string[]
  warnings?: string[]
}

export interface HarnessStatusResult {
  manifest: string
  installed: boolean
  version?: string
  current: string[]
  modified: string[]
  missing: string[]
  stale: string[]
  staleModified: string[]
  staleMissing: string[]
}

export interface HarnessPruneResult {
  manifest: string
  dryRun: boolean
  deleted: string[]
  wouldDelete: string[]
  preservedModified: string[]
  missing: string[]
}

interface PackageMetadata {
  package: string
  version: string
  toolApi: number
  harnessApi: number
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

function packageMetadata(): PackageMetadata {
  const root = packageRoot()
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
    name?: unknown
    version?: unknown
  }
  const mcp = JSON.parse(readFileSync(path.join(root, 'mcp-package.json'), 'utf8')) as {
    package?: unknown
    version?: unknown
    compatibility?: { toolApi?: unknown; harnessApi?: unknown }
  }
  if (
    typeof pkg.name !== 'string' ||
    typeof pkg.version !== 'string' ||
    mcp.package !== pkg.name ||
    mcp.version !== pkg.version ||
    !Number.isInteger(mcp.compatibility?.toolApi) ||
    !Number.isInteger(mcp.compatibility?.harnessApi)
  ) {
    throw new Error('Hubdocs package metadata is inconsistent; reinstall a valid package')
  }
  return {
    package: pkg.name,
    version: pkg.version,
    toolApi: mcp.compatibility!.toolApi as number,
    harnessApi: mcp.compatibility!.harnessApi as number,
  }
}

function sha256(content: Buffer | string): string {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}

function isWithin(root: string, candidate: string): boolean {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`)
}

function lexists(file: string): boolean {
  try {
    lstatSync(file)
    return true
  } catch {
    return false
  }
}

function resolveProjectRoot(projectRoot?: string): { root: string; realRoot: string } {
  const root = path.resolve(projectRoot ?? process.cwd())
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error(`Project root is not a directory: ${root}`)
  }
  return { root, realRoot: realpathSync(root) }
}

function resolveContainedPath(
  root: string,
  realRoot: string,
  rel: string,
  label: string,
): string {
  if (
    typeof rel !== 'string' ||
    rel.length === 0 ||
    path.isAbsolute(rel) ||
    rel.includes('\\') ||
    rel.split('/').some((part) => part === '' || part === '.' || part === '..')
  ) {
    throw new Error(`Invalid ${label} path: ${String(rel)}`)
  }
  const target = path.resolve(root, ...rel.split('/'))
  if (!isWithin(root, target)) {
    throw new Error(`${label} path escapes project root: ${rel}`)
  }

  let existing = target
  while (!lexists(existing)) existing = path.dirname(existing)
  let realExisting: string
  try {
    realExisting = realpathSync(existing)
  } catch {
    throw new Error(`${label} path uses an invalid symlink: ${rel}`)
  }
  if (!isWithin(realRoot, realExisting)) {
    throw new Error(`${label} path escapes project root through a symlink: ${rel}`)
  }
  return target
}

function resolveManagedPath(root: string, realRoot: string, rel: string): string {
  if (!rel.startsWith('.cursor/')) {
    throw new Error(`Invalid managed harness path in manifest: ${String(rel)}`)
  }
  return resolveContainedPath(root, realRoot, rel, 'Managed harness')
}

function manifestPath(root: string): string {
  return path.join(root, ...INSTALL_MANIFEST_PATH.split('/'))
}

function validateHash(value: unknown, rel: string): asserts value is string {
  if (typeof value !== 'string' || !/^sha256:[a-f0-9]{64}$/.test(value)) {
    throw new Error(`Invalid hash for managed harness path: ${rel}`)
  }
}

function readManifest(
  root: string,
  realRoot: string,
  metadata: PackageMetadata,
): HarnessInstallManifest | undefined {
  const file = resolveContainedPath(
    root,
    realRoot,
    INSTALL_MANIFEST_PATH,
    'Hubdocs install manifest',
  )
  if (!existsSync(file)) return undefined
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Partial<HarnessInstallManifest>
  if (
    raw.package !== metadata.package ||
    raw.schema !== INSTALL_MANIFEST_SCHEMA ||
    raw.toolApi !== metadata.toolApi ||
    raw.harnessApi !== metadata.harnessApi
  ) {
    throw new Error(
      `Incompatible Hubdocs install manifest at ${file}; run a compatible Hubdocs version or move the manifest aside and reinstall`,
    )
  }
  if (
    typeof raw.version !== 'string' ||
    !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(raw.version) ||
    !raw.hashes ||
    typeof raw.hashes !== 'object' ||
    Array.isArray(raw.hashes) ||
    (raw.stale !== undefined && (typeof raw.stale !== 'object' || Array.isArray(raw.stale)))
  ) {
    throw new Error(`Invalid Hubdocs install manifest at ${file}`)
  }

  const hashes: Record<string, string> = {}
  for (const [rel, hash] of Object.entries(raw.hashes)) {
    resolveManagedPath(root, realRoot, rel)
    validateHash(hash, rel)
    hashes[rel] = hash
  }
  const stale: Record<string, StaleHarnessAsset> = {}
  for (const [rel, value] of Object.entries(raw.stale ?? {})) {
    resolveManagedPath(root, realRoot, rel)
    if (
      !value ||
      typeof value !== 'object' ||
      typeof (value as StaleHarnessAsset).sinceVersion !== 'string'
    ) {
      throw new Error(`Invalid stale metadata for managed harness path: ${rel}`)
    }
    validateHash((value as StaleHarnessAsset).hash, rel)
    stale[rel] = {
      hash: (value as StaleHarnessAsset).hash,
      sinceVersion: (value as StaleHarnessAsset).sinceVersion,
    }
  }
  for (const rel of Object.keys(hashes)) {
    if (stale[rel]) throw new Error(`Harness path is both current and stale: ${rel}`)
  }
  return {
    package: raw.package,
    schema: raw.schema,
    toolApi: raw.toolApi,
    harnessApi: raw.harnessApi,
    version: raw.version,
    hashes,
    stale,
  }
}

function writeManifest(
  root: string,
  realRoot: string,
  manifest: HarnessInstallManifest,
): string {
  const file = resolveContainedPath(
    root,
    realRoot,
    INSTALL_MANIFEST_PATH,
    'Hubdocs install manifest',
  )
  mkdirSync(path.dirname(file), { recursive: true })
  const temporary = `${file}.tmp-${process.pid}`
  writeFileSync(temporary, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  renameSync(temporary, file)
  return file
}

function currentAssetHashes(): Map<string, { source: string; hash: string }> {
  const sourceRoot = path.join(packageRoot(), 'harness', 'cursor')
  const assets = new Map<string, { source: string; hash: string }>()
  for (const source of walk(sourceRoot)) {
    const sourceRel = path.relative(sourceRoot, source)
    if (sourceRel === path.join('extracts', 'extract-registry.hubdocs.json')) continue
    const rel = ['.cursor', ...sourceRel.split(path.sep)].join('/')
    assets.set(rel, { source, hash: sha256(readFileSync(source)) })
  }
  return assets
}

function mergeExtractRegistry(projectRoot: string, realRoot: string): string {
  const source = path.join(
    packageRoot(),
    'harness',
    'cursor',
    'extracts',
    'extract-registry.hubdocs.json',
  )
  const target = resolveContainedPath(
    projectRoot,
    realRoot,
    '.cursor/extracts/extract-registry.json',
    'Shared extract registry',
  )
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
  const { root, realRoot } = resolveProjectRoot(opts.projectRoot)
  const metadata = packageMetadata()
  const previous = readManifest(root, realRoot, metadata)
  const assets = currentAssetHashes()
  resolveContainedPath(root, realRoot, INSTALL_MANIFEST_PATH, 'Hubdocs install manifest')
  resolveContainedPath(
    root,
    realRoot,
    '.cursor/extracts/extract-registry.json',
    'Shared extract registry',
  )
  resolveContainedPath(root, realRoot, 'platform-repos.json', 'Shared platform repository map')
  for (const rel of assets.keys()) resolveManagedPath(root, realRoot, rel)
  const hashes = Object.fromEntries([...assets].map(([rel, asset]) => [rel, asset.hash]))
  const stale: Record<string, StaleHarnessAsset> = { ...(previous?.stale ?? {}) }
  for (const [rel, hash] of Object.entries(previous?.hashes ?? {})) {
    if (!assets.has(rel) && !stale[rel]) {
      stale[rel] = { hash, sinceVersion: metadata.version }
    }
  }
  for (const rel of assets.keys()) delete stale[rel]

  const result: HarnessInstallResult = {
    written: [],
    unchanged: [],
    skipped: [],
    stale: Object.keys(stale).map((rel) => resolveManagedPath(root, realRoot, rel)),
    manifest: manifestPath(root),
  }

  for (const [rel, asset] of assets) {
    const target = resolveManagedPath(root, realRoot, rel)
    const content = readFileSync(asset.source)

    if (existsSync(target)) {
      const currentHash = sha256(readFileSync(target))
      if (currentHash === asset.hash) {
        result.unchanged.push(target)
        continue
      }
      const previousHash = previous?.hashes[rel]
      const locallyModified = previousHash === undefined || currentHash !== previousHash
      if (locallyModified && !opts.force) {
        result.skipped.push(target)
        continue
      }
    }

    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content)
    result.written.push(target)
  }

  const nextManifest: HarnessInstallManifest = {
    package: metadata.package,
    schema: INSTALL_MANIFEST_SCHEMA,
    toolApi: metadata.toolApi,
    harnessApi: metadata.harnessApi,
    version: metadata.version,
    hashes,
    stale,
  }
  result.manifest = writeManifest(root, realRoot, nextManifest)
  result.registry = mergeExtractRegistry(root, realRoot)
  const maps = mergePlatformRepos(root)
  result.platformRepos = maps.path
  result.mergedSkills = maps.mergedSkills
  result.warnings = maps.warnings
  return result
}

export function statusHarness(opts: { projectRoot?: string } = {}): HarnessStatusResult {
  const { root, realRoot } = resolveProjectRoot(opts.projectRoot)
  const metadata = packageMetadata()
  const manifest = readManifest(root, realRoot, metadata)
  const result: HarnessStatusResult = {
    manifest: manifestPath(root),
    installed: manifest !== undefined,
    version: manifest?.version,
    current: [],
    modified: [],
    missing: [],
    stale: [],
    staleModified: [],
    staleMissing: [],
  }
  if (!manifest) return result

  for (const [rel, expectedHash] of Object.entries(manifest.hashes)) {
    const target = resolveManagedPath(root, realRoot, rel)
    if (!existsSync(target)) result.missing.push(target)
    else if (sha256(readFileSync(target)) === expectedHash) result.current.push(target)
    else result.modified.push(target)
  }
  for (const [rel, asset] of Object.entries(manifest.stale)) {
    const target = resolveManagedPath(root, realRoot, rel)
    if (!existsSync(target)) result.staleMissing.push(target)
    else if (sha256(readFileSync(target)) === asset.hash) result.stale.push(target)
    else result.staleModified.push(target)
  }
  return result
}

export function pruneHarness(opts: {
  projectRoot?: string
  yes?: boolean
} = {}): HarnessPruneResult {
  const { root, realRoot } = resolveProjectRoot(opts.projectRoot)
  const metadata = packageMetadata()
  const manifest = readManifest(root, realRoot, metadata)
  const result: HarnessPruneResult = {
    manifest: manifestPath(root),
    dryRun: !opts.yes,
    deleted: [],
    wouldDelete: [],
    preservedModified: [],
    missing: [],
  }
  if (!manifest) return result

  const retained = { ...manifest.stale }
  for (const [rel, asset] of Object.entries(manifest.stale)) {
    const target = resolveManagedPath(root, realRoot, rel)
    if (!existsSync(target)) {
      result.missing.push(target)
      if (opts.yes) delete retained[rel]
      continue
    }
    if (sha256(readFileSync(target)) !== asset.hash) {
      result.preservedModified.push(target)
      continue
    }
    if (!opts.yes) {
      result.wouldDelete.push(target)
      continue
    }
    unlinkSync(target)
    result.deleted.push(target)
    delete retained[rel]
  }

  if (opts.yes && Object.keys(retained).length !== Object.keys(manifest.stale).length) {
    writeManifest(root, realRoot, { ...manifest, stale: retained })
  }
  return result
}
