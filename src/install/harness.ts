import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { packageRoot } from '../config/docs-root.js'
import {
  canonicalGitignorePattern,
  mergeOwnedGitignore,
  removeGitignoreEntries,
  type OwnedGitignoreEntry,
} from './gitignore.js'
import { forgetInstall, recordInstall } from './ledger.js'

export type { OwnedGitignoreEntry } from './gitignore.js'

export const INSTALL_MANIFEST_PATH = '.hubdocs/install-manifest.json'
export const INSTALL_MANIFEST_SCHEMA = 1
export type HubdocsHarnessType = 'docs' | 'consumer'

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

export interface GitignoreEntryStatus {
  pattern: string
  shared: boolean
  status: 'present' | 'missing'
}

export interface HarnessInstallManifest {
  package: string
  schema: number
  toolApi: number
  harnessApi: number
  version: string
  hashes: Record<string, string>
  stale: Record<string, StaleHarnessAsset>
  /** Exact ignore entries Hubdocs ensured; shared kept on deinit. */
  gitignore?: OwnedGitignoreEntry[]
}

export interface HarnessInstallResult {
  written: string[]
  unchanged: string[]
  skipped: string[]
  stale: string[]
  manifest: string
  registry?: string
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
  gitignore: GitignoreEntryStatus[]
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

function validateManifestGitignore(value: unknown): OwnedGitignoreEntry[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) {
    throw new Error('Invalid Hubdocs install manifest gitignore')
  }
  const seen = new Set<string>()
  const entries: OwnedGitignoreEntry[] = []
  for (const raw of value) {
    if (
      !raw ||
      typeof raw !== 'object' ||
      typeof (raw as OwnedGitignoreEntry).pattern !== 'string' ||
      !(raw as OwnedGitignoreEntry).pattern.trim() ||
      /[\r\n]/.test((raw as OwnedGitignoreEntry).pattern)
    ) {
      throw new Error('Invalid Hubdocs install manifest gitignore entry')
    }
    if (
      (raw as OwnedGitignoreEntry).shared !== undefined &&
      typeof (raw as OwnedGitignoreEntry).shared !== 'boolean'
    ) {
      throw new Error('Invalid Hubdocs install manifest gitignore shared flag')
    }
    const pattern = (raw as OwnedGitignoreEntry).pattern.trim()
    const canonical = canonicalGitignorePattern(pattern)
    if (!canonical || seen.has(canonical)) continue
    seen.add(canonical)
    entries.push({
      pattern,
      ...((raw as OwnedGitignoreEntry).shared ? { shared: true } : {}),
    })
  }
  return entries
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
  const gitignore = validateManifestGitignore(raw.gitignore)
  return {
    package: raw.package,
    schema: raw.schema,
    toolApi: raw.toolApi,
    harnessApi: raw.harnessApi,
    version: raw.version,
    hashes,
    stale,
    ...(gitignore.length ? { gitignore } : {}),
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

const CONSUMER_ASSETS = new Set([
  path.join('skills', 'hubdocs', 'SKILL.md'),
  path.join('rules', 'hubdocs.mdc'),
  path.join('schemas', 'hubdocs', 'missing-optional-event.schema.json'),
  path.join('extracts', 'hubdocs-phase-hooks.md'),
])

function currentAssetHashes(
  type: HubdocsHarnessType,
): Map<string, { source: string; hash: string }> {
  const sourceRoot = path.join(packageRoot(), 'harness', 'cursor')
  const assets = new Map<string, { source: string; hash: string }>()
  for (const source of walk(sourceRoot)) {
    const sourceRel = path.relative(sourceRoot, source)
    if (sourceRel === path.join('extracts', 'extract-registry.hubdocs.json')) continue
    if (type === 'consumer' && !CONSUMER_ASSETS.has(sourceRel)) continue
    const rel = ['.cursor', ...sourceRel.split(path.sep)].join('/')
    assets.set(rel, { source, hash: sha256(readFileSync(source)) })
  }
  return assets
}

function mergeExtractRegistry(
  projectRoot: string,
  realRoot: string,
  type: HubdocsHarnessType,
): string {
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
  const bundles =
    type === 'consumer'
      ? { hubdocs: owned.bundles.hubdocs }
      : owned.bundles
  current.version = Math.max(current.version ?? 1, owned.version ?? 1)
  if (type === 'consumer') delete current.bundles['architecture-core']
  current.bundles = {
    ...current.bundles,
    ...bundles,
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
  type?: HubdocsHarnessType
  gitignoreEntries?: OwnedGitignoreEntry[]
} = {}): HarnessInstallResult {
  const { root, realRoot } = resolveProjectRoot(opts.projectRoot)
  const type = opts.type ?? 'docs'
  const metadata = packageMetadata()
  const previous = readManifest(root, realRoot, metadata)
  const assets = currentAssetHashes(type)
  resolveContainedPath(root, realRoot, INSTALL_MANIFEST_PATH, 'Hubdocs install manifest')
  resolveContainedPath(
    root,
    realRoot,
    '.cursor/extracts/extract-registry.json',
    'Shared extract registry',
  )
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

  const gitignore = mergeOwnedGitignore(previous?.gitignore, opts.gitignoreEntries)
  const nextManifest: HarnessInstallManifest = {
    package: metadata.package,
    schema: INSTALL_MANIFEST_SCHEMA,
    toolApi: metadata.toolApi,
    harnessApi: metadata.harnessApi,
    version: metadata.version,
    hashes,
    stale,
    ...(gitignore.length ? { gitignore } : {}),
  }
  result.manifest = writeManifest(root, realRoot, nextManifest)
  result.registry = mergeExtractRegistry(root, realRoot, type)
  recordInstall(root)
  return result
}

/**
 * Update only managed gitignore metadata on an existing install (used when
 * init merges ignores after harness assets are already written).
 */
export function recordManagedGitignore(
  projectRoot: string,
  entries: OwnedGitignoreEntry[],
): HarnessInstallManifest {
  const { root, realRoot } = resolveProjectRoot(projectRoot)
  const metadata = packageMetadata()
  const manifest = readManifest(root, realRoot, metadata)
  if (!manifest) {
    throw new Error(`Hubdocs install manifest not found: ${manifestPath(root)}`)
  }
  const gitignore = mergeOwnedGitignore(manifest.gitignore, entries)
  const next: HarnessInstallManifest = {
    ...manifest,
    ...(gitignore.length ? { gitignore } : {}),
  }
  if (!gitignore.length) delete next.gitignore
  writeManifest(root, realRoot, next)
  return next
}

function gitignoreStatus(root: string, manifest: HarnessInstallManifest): GitignoreEntryStatus[] {
  const entries = manifest.gitignore ?? []
  if (!entries.length) return []
  const file = path.join(root, '.gitignore')
  const present = new Set<string>()
  if (existsSync(file) && lstatSync(file).isFile()) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) present.add(canonicalGitignorePattern(trimmed))
    }
  }
  return entries.map((entry) => ({
    pattern: entry.pattern,
    shared: Boolean(entry.shared),
    status: present.has(canonicalGitignorePattern(entry.pattern)) ? 'present' : 'missing',
  }))
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
    gitignore: [],
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
  result.gitignore = gitignoreStatus(root, manifest)
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

export interface HarnessUninstallResult {
  manifest: string
  dryRun: boolean
  deleted: string[]
  wouldDelete: string[]
  preservedModified: string[]
  missing: string[]
  manifestRemoved: boolean
  registry?: string
}

function pruneEmptyDirs(root: string, files: string[]): void {
  const dirs = new Set<string>()
  for (const file of files) {
    let dir = path.dirname(file)
    while (isWithin(root, dir) && dir !== root) {
      dirs.add(dir)
      dir = path.dirname(dir)
    }
  }
  for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
    try {
      if (existsSync(dir) && readdirSync(dir).length === 0) rmdirSync(dir)
    } catch {
      /* leave non-empty or busy dirs */
    }
  }
}

/**
 * Remove the hubdocs-owned bundle keys from the shared extract registry.
 * Deletes the file only when no other toolkit's bundles remain.
 */
function uninstallExtractRegistry(
  projectRoot: string,
  realRoot: string,
  dryRun: boolean,
): string | undefined {
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
  if (!existsSync(source) || !existsSync(target)) return undefined
  const owned = JSON.parse(readFileSync(source, 'utf8')) as {
    bundles?: Record<string, string[]>
  }
  const current = JSON.parse(readFileSync(target, 'utf8')) as {
    version?: number
    bundles?: Record<string, string[]>
  }
  const ownedKeys = Object.keys(owned.bundles ?? {})
  const currentBundles = current.bundles ?? {}
  const present = ownedKeys.filter((key) => key in currentBundles)
  if (present.length === 0) return undefined
  if (dryRun) {
    return `${target} (would remove ${present.length} hubdocs bundle key(s))`
  }
  for (const key of present) delete currentBundles[key]
  current.bundles = currentBundles
  if (Object.keys(currentBundles).length === 0) {
    unlinkSync(target)
    return `${target} (removed; no bundles left)`
  }
  writeFileSync(target, `${JSON.stringify(current, null, 2)}\n`, 'utf8')
  return `${target} (removed ${present.length} hubdocs bundle key(s))`
}

/**
 * Full removal: delete every hubdocs-owned harness file recorded in the manifest
 * (current + stale), preserve and report member-modified files, un-merge the
 * shared extract registry, remove exclusive ignore entries (keep shared), then
 * drop the manifest. Dry-run unless `yes`.
 */
export function uninstallHarness(opts: {
  projectRoot?: string
  yes?: boolean
} = {}): HarnessUninstallResult {
  const { root, realRoot } = resolveProjectRoot(opts.projectRoot)
  const metadata = packageMetadata()
  const manifest = readManifest(root, realRoot, metadata)
  const dryRun = !opts.yes
  const result: HarnessUninstallResult = {
    manifest: manifestPath(root),
    dryRun,
    deleted: [],
    wouldDelete: [],
    preservedModified: [],
    missing: [],
    manifestRemoved: false,
  }
  if (!manifest) return result

  const owned: Array<[string, string]> = [
    ...Object.entries(manifest.hashes),
    ...Object.entries(manifest.stale).map(
      ([rel, asset]) => [rel, asset.hash] as [string, string],
    ),
  ]
  for (const [rel, expectedHash] of owned) {
    const target = resolveManagedPath(root, realRoot, rel)
    if (!existsSync(target)) {
      result.missing.push(target)
      continue
    }
    if (sha256(readFileSync(target)) !== expectedHash) {
      result.preservedModified.push(target)
      continue
    }
    if (dryRun) {
      result.wouldDelete.push(target)
      continue
    }
    unlinkSync(target)
    result.deleted.push(target)
  }

  const registry = uninstallExtractRegistry(root, realRoot, dryRun)
  if (registry) result.registry = registry

  // Remove only exclusively-owned ignore entries; shared entries (for example
  // `.cursor/`) may still be relied on by another toolkit, so keep them.
  const exclusiveIgnore = (manifest.gitignore ?? [])
    .filter((entry) => !entry.shared)
    .map((entry) => entry.pattern)
  if (exclusiveIgnore.length) {
    if (dryRun) {
      const file = path.join(root, '.gitignore')
      const present =
        existsSync(file) && lstatSync(file).isFile()
          ? new Set(
              readFileSync(file, 'utf8')
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter((line) => line && !line.startsWith('#'))
                .map(canonicalGitignorePattern),
            )
          : new Set<string>()
      for (const pattern of exclusiveIgnore) {
        if (present.has(canonicalGitignorePattern(pattern))) {
          result.wouldDelete.push(`${file} entry: ${pattern}`)
        }
      }
    } else {
      const removed = removeGitignoreEntries(root, exclusiveIgnore)
      for (const pattern of removed.removed) {
        result.deleted.push(`${removed.file} entry: ${pattern}`)
      }
    }
  }

  const manifestFile = resolveContainedPath(
    root,
    realRoot,
    INSTALL_MANIFEST_PATH,
    'Hubdocs install manifest',
  )
  if (dryRun) {
    result.wouldDelete.push(manifestFile)
    return result
  }
  if (existsSync(manifestFile)) {
    unlinkSync(manifestFile)
    result.manifestRemoved = true
  }
  forgetInstall(root)
  pruneEmptyDirs(root, [...result.deleted.filter((p) => !p.includes(' entry: ')), manifestFile])
  return result
}
