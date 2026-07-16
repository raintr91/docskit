import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { resolveDocsRoot } from '../config/docs-root.js'
import {
  CANONICAL_DIR,
  expectedCanonicalPath,
  indexIds,
  isRedirectStub,
  kindOf,
  relToRoot,
  walkMdFiles,
  SCAN_MD_DIRS,
  type IdKind,
} from '../scan/ids.js'
import { depsFromFiles, dependentsOf, validateMdLinks } from '../scan/links.js'
import { routeTopic } from '../scan/route.js'

function text(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  }
}

function toRelIndex(docsRoot: string) {
  const map = indexIds(docsRoot)
  const out = new Map<
    string,
    { id: string; kind: IdKind; files: string[]; primary?: string }
  >()
  for (const [id, meta] of map) {
    const files = meta.files.map((f) => (path.isAbsolute(f) ? relToRoot(docsRoot, f) : f))
    out.set(id, {
      id,
      kind: meta.kind,
      files,
      primary: files[0],
    })
  }
  return out
}

function chapterHasId(docsRoot: string, id: string): boolean {
  const exp = expectedCanonicalPath(docsRoot, id)
  if (!exp || !fs.existsSync(exp)) return false
  const body = fs.readFileSync(exp, 'utf8')
  return body.includes(id)
}

export function registerTools(server: McpServer): void {
  server.tool(
    'hubdocs_list_ids',
    'List architecture/product IDs (LND/CTX/CTR/CMP/FLOW/DEP/ADR/W/API/UI) from docs hub MD (skips redirect stubs)',
    {
      docsRoot: z
        .string()
        .optional()
        .describe('Override hub root; default HUBDOCS_ROOT / docs-root.path'),
      kind: z
        .enum(['LND', 'CTX', 'CTR', 'CMP', 'FLOW', 'DEP', 'ADR', 'W', 'API', 'UI', 'OTHER', 'ALL'])
        .optional(),
      prefix: z.string().optional(),
    },
    async ({ docsRoot, kind, prefix }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = toRelIndex(root)
        let items = [...index.values()]
        if (kind && kind !== 'ALL') items = items.filter((i) => i.kind === kind)
        if (prefix) items = items.filter((i) => i.id.startsWith(prefix))
        items.sort((a, b) => a.id.localeCompare(b.id))
        return text({ docsRoot: root, count: items.length, ids: items })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool(
    'hubdocs_get_element',
    'Get primary + related files and short excerpts for one ID (canonical path first)',
    {
      id: z.string(),
      docsRoot: z.string().optional(),
      maxChars: z.number().optional().default(1200),
    },
    async ({ id, docsRoot, maxChars }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = toRelIndex(root)
        const meta = index.get(id)
        if (!meta) return text({ ok: false, error: 'not_found', id })
        const cap = Math.min(maxChars ?? 1200, 8000)
        const excerpts = meta.files.slice(0, 5).map((rel) => {
          const abs = path.join(root, rel)
          const body = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : ''
          return { file: rel, excerpt: body.slice(0, cap) }
        })
        const expected = expectedCanonicalPath(root, id)
        return text({
          ok: true,
          ...meta,
          canonicalHome: CANONICAL_DIR[meta.kind] ?? null,
          expectedPath: expected ? relToRoot(root, expected) : null,
          excerpts,
        })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool(
    'hubdocs_deps_of',
    'IDs referenced from files that define/mention this ID',
    {
      id: z.string(),
      docsRoot: z.string().optional(),
    },
    async ({ id, docsRoot }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = toRelIndex(root)
        const meta = index.get(id)
        if (!meta) return text({ ok: false, error: 'not_found', id })
        const absFiles = meta.files.map((f) => path.join(root, f))
        const deps = depsFromFiles(absFiles, id)
        return text({ ok: true, id, deps })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool(
    'hubdocs_dependents_of',
    'Other IDs whose files mention this ID',
    {
      id: z.string(),
      docsRoot: z.string().optional(),
    },
    async ({ id, docsRoot }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = indexIds(root)
        if (!index.has(id)) return text({ ok: false, error: 'not_found', id })
        const deps = dependentsOf(id, index, root)
        return text({ ok: true, id, dependents: deps })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool(
    'hubdocs_orphans',
    'Heuristic orphans vs arc42 layout: missing FLOW/ADR/CMP/W/API files; heading IDs missing from chapter',
    {
      docsRoot: z.string().optional(),
    },
    async ({ docsRoot }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const index = toRelIndex(root)
        const missingCanonical: { id: string; kind: IdKind; expected: string }[] = []
        const missingInChapter: { id: string; kind: IdKind; chapter: string }[] = []

        for (const id of index.keys()) {
          const kind = kindOf(id)
          if (kind === 'FLOW' || kind === 'ADR' || kind === 'CMP' || kind === 'W' || kind === 'API' || kind === 'UI') {
            const exp = expectedCanonicalPath(root, id)
            if (!exp) continue
            const ok =
              fs.existsSync(exp) ||
              fs.existsSync(exp.replace(/\.md$/, '/index.md')) ||
              fs.existsSync(path.dirname(exp))
            // W/API/UI: folder existence counts
            const folderOk =
              (kind === 'W' || kind === 'API' || kind === 'UI') &&
              exp &&
              fs.existsSync(path.dirname(exp))
            if (!ok && !folderOk) {
              const meta = index.get(id)!
              const hasOwn =
                kind === 'FLOW'
                  ? meta.files.some((f) => f.includes(`journeys/${id}`))
                  : meta.primary?.includes(id)
              if (!hasOwn) {
                missingCanonical.push({ id, kind, expected: relToRoot(root, exp) })
              }
            }
            continue
          }

          if (kind === 'LND' || kind === 'CTX' || kind === 'CTR' || kind === 'DEP') {
            if (!chapterHasId(root, id)) {
              const home = CANONICAL_DIR[kind] ?? '?'
              missingInChapter.push({ id, kind, chapter: `${home}/index.md` })
            }
          }
        }

        const catalogPath = path.join(root, 'architecture/06-runtime/index.md')
        const catalogTbd: string[] = []
        if (fs.existsSync(catalogPath)) {
          for (const line of fs.readFileSync(catalogPath, 'utf8').split('\n')) {
            if (/FLOW-[a-z0-9-]+/i.test(line) && /\bTBD\b|\bdraft\b/i.test(line)) {
              const m = line.match(/FLOW-[A-Za-z0-9-]+/)
              if (m) catalogTbd.push(m[0])
            }
          }
        }

        return text({
          ok: true,
          missingCanonical,
          missingInChapter,
          catalogDraftOrTbd: catalogTbd,
          note: 'Redirect stubs (landscape|context|containers|dynamics|deployments|product/shared/adr) are ignored. DYN-* not indexed.',
        })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool(
    'hubdocs_validate_links',
    'Find broken MD links under architecture/ + product (skips redirect-stub sources)',
    {
      docsRoot: z.string().optional(),
      includeProduct: z.boolean().optional().default(true),
    },
    async ({ docsRoot, includeProduct }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const dirs = includeProduct
          ? ['architecture', 'product/components', 'product/shared', 'product/common']
          : ['architecture']
        const files = walkMdFiles(root, dirs).filter((f) => !isRedirectStub(f, root))
        const broken = validateMdLinks(root, files).map((h) => ({
          ...h,
          file: relToRoot(root, h.file),
        }))
        return text({
          ok: broken.length === 0,
          brokenCount: broken.length,
          broken: broken.slice(0, 100),
        })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool(
    'hubdocs_route',
    'Map a natural-language topic to arc42 chapter path + skill (/architecture router helper)',
    {
      topic: z.string().describe('e.g. "login sequence", "containers", "ADR auth"'),
    },
    async ({ topic }) => {
      return text({ ok: true, topic, routes: routeTopic(topic) })
    },
  )

  server.tool(
    'hubdocs_journeys',
    'List FLOW-* journeys under architecture/06-runtime/journeys (catalog §06)',
    {
      docsRoot: z.string().optional(),
    },
    async ({ docsRoot }) => {
      try {
        const root = resolveDocsRoot(docsRoot)
        const dir = path.join(root, 'architecture/06-runtime/journeys')
        if (!fs.existsSync(dir)) return text({ ok: false, error: 'no_journeys_dir' })
        const files = fs
          .readdirSync(dir)
          .filter((n) => n.startsWith('FLOW-') && n.endsWith('.md'))
          .sort()
        const journeys = files.map((n) => {
          const abs = path.join(dir, n)
          const head = fs.readFileSync(abs, 'utf8').split('\n').slice(0, 12).join('\n')
          const domain = head.match(/^domain:\s*(.+)$/m)?.[1]?.trim()
          const status = head.match(/^status:\s*(.+)$/m)?.[1]?.trim()
          return {
            id: n.replace(/\.md$/, ''),
            file: `architecture/06-runtime/journeys/${n}`,
            domain,
            status,
          }
        })
        return text({
          ok: true,
          count: journeys.length,
          catalog: 'architecture/06-runtime/index.md',
          journeys,
        })
      } catch (err) {
        return text({ ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    },
  )

  server.tool(
    'hubdocs_layout',
    'Describe expected arc42 × C4 docs hub layout (canonical paths per ID kind)',
    {},
    async () => {
      return text({
        ok: true,
        chapters: 'architecture/01 … architecture/12',
        redirectStubsIgnored: [
          'architecture/landscape',
          'architecture/context',
          'architecture/containers',
          'architecture/dynamics',
          'architecture/deployments',
          'product/shared/adr',
        ],
        idHomes: CANONICAL_DIR,
        scanDirs: SCAN_MD_DIRS,
        notes: [
          'LND/CTX/CTR/DEP are headings inside chapter index.md — not separate files',
          'FLOW-* files under architecture/06-runtime/journeys/',
          'ADR-* under architecture/09-decisions/',
          'CMP/W/API/UI under product/ — never under architecture/05 code/',
          'DYN-* deprecated — use FLOW-* + /journey',
        ],
      })
    },
  )
}
