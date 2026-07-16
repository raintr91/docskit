/**
 * Resolve docs hub root (any arc42 × C4 MD tree with architecture/).
 * Order: explicit → HUBDOCS_ROOT → docs-root.path → cwd / sibling heuristics.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function packageRoot(): string {
  return pkgRoot
}

function looksLikeHub(abs: string): boolean {
  return fs.existsSync(path.join(abs, 'architecture'))
}

function readDocsRootMarker(): string | undefined {
  const marker = path.join(pkgRoot, 'docs-root.path')
  if (!fs.existsSync(marker)) return undefined
  const line = fs.readFileSync(marker, 'utf8').trim().split(/\r?\n/)[0]?.trim()
  return line || undefined
}

/** Best-effort path for MCP env (may be empty string if unknown). */
export function defaultHubdocsRoot(): string {
  if (process.env.HUBDOCS_ROOT) return path.resolve(process.env.HUBDOCS_ROOT)
  const marker = readDocsRootMarker()
  if (marker) return path.resolve(marker)
  const sibling = path.resolve(pkgRoot, '../base-docs')
  if (looksLikeHub(sibling)) return sibling
  if (looksLikeHub(process.cwd())) return process.cwd()
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
  const marker = readDocsRootMarker()
  if (marker) {
    const abs = path.resolve(marker)
    if (!fs.existsSync(abs) || !looksLikeHub(abs)) {
      throw new Error(
        `docs-root.path invalid (${marker}) — set HUBDOCS_ROOT or hubdocs init --docs-root=…`,
      )
    }
    return abs
  }
  const sibling = path.resolve(pkgRoot, '../base-docs')
  if (looksLikeHub(sibling)) return sibling
  if (looksLikeHub(process.cwd())) return process.cwd()
  throw new Error(
    'Cannot resolve docs root — set HUBDOCS_ROOT or pass docsRoot (hub must contain architecture/)',
  )
}
