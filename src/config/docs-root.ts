/**
 * Resolve docs hub root (any arc42 × C4 MD tree with architecture/).
 *
 * Order: explicit tool argument → project MCP HUBDOCS_ROOT → cwd (if hub) → error.
 * The package never remembers or searches for a target repository.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

export function packageRoot(): string {
  return pkgRoot
}

export function looksLikeHub(abs: string): boolean {
  try {
    return fs.statSync(path.join(abs, 'architecture')).isDirectory()
  } catch {
    return false
  }
}

/**
 * Best-effort root for local wiring. Empty when no project root is available.
 */
export function defaultHubdocsRoot(): string {
  if (process.env.HUBDOCS_ROOT) return path.resolve(process.env.HUBDOCS_ROOT)
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
  if (looksLikeHub(process.cwd())) return process.cwd()
  throw new Error(
    'Cannot resolve docs root. Pass docsRoot to the tool, configure a project-local HUBDOCS_ROOT, ' +
      'or cd into a docs hub (must contain architecture/). Setup: hubdocs init --location=local',
  )
}
