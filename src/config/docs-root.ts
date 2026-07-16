/**
 * Resolve docs hub root (any arc42 × C4 MD tree with architecture/).
 *
 * Order: explicit → HUBDOCS_ROOT → **cwd** (if hub) → docs-root.path → sibling heuristic.
 * Prefer `cd <docs-hub> && hubdocs init` — no long --docs-root needed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function packageRoot(): string {
  return pkgRoot
}

export function looksLikeHub(abs: string): boolean {
  return fs.existsSync(path.join(abs, 'architecture'))
}

function readDocsRootMarker(): string | undefined {
  const marker = path.join(pkgRoot, 'docs-root.path')
  if (!fs.existsSync(marker)) return undefined
  const line = fs.readFileSync(marker, 'utf8').trim().split(/\r?\n/)[0]?.trim()
  return line || undefined
}

/** Persist resolved hub root next to the installed package (for MCP env later). */
export function writeDocsRootMarker(abs: string): void {
  fs.writeFileSync(path.join(pkgRoot, 'docs-root.path'), `${path.resolve(abs)}\n`, 'utf8')
}

/**
 * Best-effort path for MCP env / init.
 * Empty string if unknown — caller should require --docs-root or cd into hub.
 */
export function defaultHubdocsRoot(): string {
  if (process.env.HUBDOCS_ROOT) return path.resolve(process.env.HUBDOCS_ROOT)
  if (looksLikeHub(process.cwd())) return process.cwd()
  const marker = readDocsRootMarker()
  if (marker) {
    const abs = path.resolve(marker)
    if (looksLikeHub(abs)) return abs
  }
  const sibling = path.resolve(pkgRoot, '../base-docs')
  if (looksLikeHub(sibling)) return sibling
  return ''
}

export function resolveDocsRoot(explicit?: string): string {
  if (explicit) {
    const abs = path.resolve(explicit)
    if (!fs.existsSync(abs)) throw new Error(`docsRoot not found: ${abs}`)
    if (!looksLikeHub(abs)) {
      throw new Error(`docsRoot missing architecture/: ${abs}`)
    }
    return abs
  }
  if (process.env.HUBDOCS_ROOT) {
    const abs = path.resolve(process.env.HUBDOCS_ROOT)
    if (!fs.existsSync(abs)) throw new Error(`HUBDOCS_ROOT not found: ${abs}`)
    if (!looksLikeHub(abs)) {
      throw new Error(`HUBDOCS_ROOT missing architecture/: ${abs}`)
    }
    return abs
  }
  if (looksLikeHub(process.cwd())) return process.cwd()
  const marker = readDocsRootMarker()
  if (marker) {
    const abs = path.resolve(marker)
    if (!fs.existsSync(abs) || !looksLikeHub(abs)) {
      throw new Error(
        `docs-root.path invalid (${marker}) — cd into docs hub and run hubdocs init, or pass --docs-root=…`,
      )
    }
    return abs
  }
  const sibling = path.resolve(pkgRoot, '../base-docs')
  if (looksLikeHub(sibling)) return sibling
  throw new Error(
    'Cannot resolve docs root — cd into your docs hub (must contain architecture/) then hubdocs init, or pass --docs-root=…',
  )
}
