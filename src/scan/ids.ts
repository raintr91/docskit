import fs from 'node:fs'
import path from 'node:path'

export type IdKind =
  | 'LND'
  | 'CTX'
  | 'CTR'
  | 'CMP'
  | 'FLOW'
  | 'DEP'
  | 'ADR'
  | 'W'
  | 'API'
  | 'UI'
  | 'OTHER'

export type HubId = {
  id: string
  kind: IdKind
  files: string[]
  /** First file under the canonical chapter/product path when known */
  primary?: string
}

/** Old flat C4 + ADR paths — redirect stubs only (not SSOT). */
const REDIRECT_STUB_RE =
  /(?:^|\/)architecture\/(?:landscape|context|containers|dynamics|deployments)(?:\/|$)|(?:^|\/)product\/shared\/adr(?:\/|$)/

const ID_RE =
  /\b((?:LND|CTX|CTR|CMP|FLOW|DEP|ADR|SC|TC)-[A-Za-z0-9][A-Za-z0-9_-]*|(?:W|API|UI)-[A-Z]{2}-[A-Z0-9]+-\d{3})\b/g

/** Scan roots for MD (arc42 × product). */
export const SCAN_MD_DIRS = [
  'architecture',
  'Overview',
  'Surfaces',
  'Architecture',
  'product/components',
  'product/shared',
  'product/common',
  'product/legacy-dynamics',
] as const

/** Canonical home for each ID kind (architecture-core). */
export const CANONICAL_DIR: Partial<Record<IdKind, string>> = {
  LND: 'architecture/03-context',
  CTX: 'architecture/03-context',
  CTR: 'architecture/05-building-blocks',
  FLOW: 'architecture/06-runtime/journeys',
  DEP: 'architecture/07-deployment',
  ADR: 'architecture/09-decisions',
  CMP: 'Surfaces',
  W: 'Surfaces',
  API: 'Surfaces',
  UI: 'Surfaces',
}

export function kindOf(id: string): IdKind {
  const p = id.split('-')[0]
  if (['LND', 'CTX', 'CTR', 'CMP', 'FLOW', 'DEP', 'ADR', 'W', 'API', 'UI'].includes(p)) {
    return p as IdKind
  }
  return 'OTHER'
}

export function isRedirectStub(relOrAbs: string, docsRoot?: string): boolean {
  const rel = docsRoot
    ? path.relative(docsRoot, path.isAbsolute(relOrAbs) ? relOrAbs : path.join(docsRoot, relOrAbs))
    : relOrAbs
  return REDIRECT_STUB_RE.test(rel.split(path.sep).join('/'))
}

export function walkMdFiles(root: string, relDirs: string[]): string[] {
  const out: string[] = []
  for (const rel of relDirs) {
    const base = path.join(root, rel)
    if (!fs.existsSync(base)) continue
    walk(base, out)
  }
  return out
}

function walk(dir: string, out: string[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name.startsWith('.')) continue
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p, out)
    else if (/\.(md|markdown)$/i.test(ent.name)) out.push(p)
  }
}

export function extractIdsFromText(text: string): Set<string> {
  const s = new Set<string>()
  for (const m of text.matchAll(ID_RE)) {
    const id = m[1]
    // DYN-* deprecated — do not index as live IDs
    if (id.startsWith('DYN-')) continue
    s.add(id)
  }
  return s
}

function fileRank(docsRoot: string, id: string, absFile: string): number {
  const rel = relToRoot(docsRoot, absFile)
  if (isRedirectStub(rel)) return 100
  const kind = kindOf(id)
  const home = CANONICAL_DIR[kind]
  if (home && rel.startsWith(home)) {
    if (kind === 'FLOW' && path.basename(absFile).startsWith(id)) return 0
    if (kind === 'ADR' && path.basename(absFile).startsWith(id.split('-').slice(0, 2).join('-'))) {
      return 0
    }
    if (kind === 'CMP' && (rel.includes(`/${id}`) || rel.includes(`/${id}/`))) return 0
    if ((kind === 'W' || kind === 'API' || kind === 'UI') && rel.includes(`/${id}/`)) return 0
    return 1
  }
  return 10
}

function sortFiles(docsRoot: string, id: string, files: string[]): string[] {
  return [...files].sort(
    (a, b) => fileRank(docsRoot, id, a) - fileRank(docsRoot, id, b) || a.localeCompare(b),
  )
}

export function indexIds(docsRoot: string): Map<string, HubId> {
  const files = walkMdFiles(docsRoot, [...SCAN_MD_DIRS]).filter((f) => !isRedirectStub(f, docsRoot))
  const map = new Map<string, HubId>()

  for (const f of files) {
    const base = path.basename(f, path.extname(f))
    if (/^FLOW-/.test(base)) add(map, base, f)

    const adr = base.match(/^(ADR-\d+)/)
    if (adr) {
      add(map, adr[1], f)
      add(map, base, f) // ADR-001-arc42-toc slug form
    }

    const cmpFolder = f.match(/[\\/](?:product[\\/]components|Surfaces[\\/][^\\/]+[\\/]Modules)[\\/](CMP-\d+[-\w]*)[\\/]/i)
    if (cmpFolder) {
      add(map, cmpFolder[1], f)
      const short = cmpFolder[1].match(/^(CMP-\d+)/)
      if (short) add(map, short[1], f)
    }

    // Code folders: product/**/code/{W|API|UI}-* or Surfaces/.../Functions/*/{W|API|UI}-*
    const codeFolder = f.match(/[\\/](?:code|Functions[\\/](?:Screen|API contract))[\\/]((?:W|API|UI)-[A-Z]{2}-[A-Z0-9]+-\d{3})[\\/]/i)
    if (codeFolder) add(map, codeFolder[1], f)
  }

  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8')
    for (const id of extractIdsFromText(text)) add(map, id, f)
  }

  for (const [id, meta] of map) {
    meta.files = sortFiles(docsRoot, id, meta.files)
    meta.primary = meta.files[0]
  }

  return map
}

function add(map: Map<string, HubId>, id: string, file: string) {
  const existing = map.get(id)
  if (existing) {
    if (!existing.files.includes(file)) existing.files.push(file)
  } else {
    map.set(id, { id, kind: kindOf(id), files: [file] })
  }
}

export function relToRoot(docsRoot: string, abs: string): string {
  return path.relative(docsRoot, abs).split(path.sep).join('/')
}

/** Expected on-disk path for kinds that have a file/folder SSOT. */
export function expectedCanonicalPath(docsRoot: string, id: string): string | null {
  const kind = kindOf(id)
  if (kind === 'FLOW') {
    return path.join(docsRoot, 'architecture/06-runtime/journeys', `${id}.md`)
  }
  if (kind === 'ADR') {
    const dir = path.join(docsRoot, 'architecture/09-decisions')
    if (!fs.existsSync(dir)) return null
    const prefix = id.match(/^(ADR-\d+)/)?.[1] ?? id
    const hit = fs.readdirSync(dir).find((n) => n.startsWith(prefix) && n.endsWith('.md'))
    return hit ? path.join(dir, hit) : path.join(dir, `${id}.md`)
  }
  if (kind === 'CMP') {
    const base = path.join(docsRoot, 'product/components')
    if (fs.existsSync(base)) {
      const folder = fs.readdirSync(base).find((n) => n === id || n.startsWith(id + '-'))
      if (folder) return path.join(base, folder, 'index.md')
    }
    return null
  }
  if (kind === 'W' || kind === 'API' || kind === 'UI') {
    // Prefer folder under product/**/code/<id>/ or Surfaces/**/Functions/*/<id>/
    const hits: string[] = []
    const walkCode = (dir: string) => {
      if (!fs.existsSync(dir)) return
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name.startsWith('.') || ent.name === 'node_modules') continue
        const p = path.join(dir, ent.name)
        if (ent.isDirectory()) {
          if (ent.name === id) hits.push(path.join(p, 'index.md'))
          else walkCode(p)
        }
      }
    }
    walkCode(path.join(docsRoot, 'product'))
    walkCode(path.join(docsRoot, 'Surfaces'))
    return hits[0] ?? null
  }
  // LND/CTX/CTR/DEP live as headings inside chapter index — return chapter file
  const chapter = CANONICAL_DIR[kind]
  if (chapter) return path.join(docsRoot, chapter, 'index.md')
  return null
}
