/** Topic → arc42 chapter + skill (architecture-core / C4-SKILL-MCP-NOTES). */

export type RouteHit = {
  chapter: string
  path: string
  skill: string
  note?: string
}

const ROUTES: { keys: string[]; hit: RouteHit }[] = [
  {
    keys: ['intro', 'introduction', '01', 'scope', 'overview'],
    hit: {
      chapter: '01',
      path: 'architecture/01-introduction/',
      skill: '/architecture',
      note: 'stub prose OK',
    },
  },
  {
    keys: ['constraint', '02'],
    hit: { chapter: '02', path: 'architecture/02-constraints/', skill: '/architecture' },
  },
  {
    keys: ['context', 'landscape', 'lnd', 'ctx', '03', 'boundary'],
    hit: { chapter: '03', path: 'architecture/03-context/', skill: '/context' },
  },
  {
    keys: ['strategy', 'solution', '04'],
    hit: {
      chapter: '04',
      path: 'architecture/04-solution-strategy/',
      skill: '/architecture',
      note: 'prose → ADR via /decision',
    },
  },
  {
    keys: ['container', 'building', 'ctr', '05', 'surface'],
    hit: {
      chapter: '05',
      path: 'architecture/05-building-blocks/',
      skill: '/containers',
    },
  },
  {
    keys: ['component', 'cmp', 'module'],
    hit: { chapter: '05', path: 'Surfaces/', skill: '/module' },
  },
  {
    keys: ['journey', 'flow', 'runtime', 'sequence', '06'],
    hit: {
      chapter: '06',
      path: 'architecture/06-runtime/journeys/',
      skill: '/journey',
    },
  },
  {
    keys: ['dynamics', 'dyn'],
    hit: {
      chapter: '06',
      path: 'architecture/06-runtime/journeys/',
      skill: '/journey',
      note: '/dynamics deprecated — use /journey + FLOW-*',
    },
  },
  {
    keys: ['mechanism'],
    hit: {
      chapter: '06',
      path: 'architecture/06-runtime/mechanisms/',
      skill: '/journey',
      note: 'optional mechanisms under §06',
    },
  },
  {
    keys: ['deploy', 'dep', '07'],
    hit: {
      chapter: '07',
      path: 'architecture/07-deployment/',
      skill: '/deployment',
      note: 'stub-first — do not invent topology',
    },
  },
  {
    keys: ['cross', 'security', 'observ', 'config', '08'],
    hit: {
      chapter: '08',
      path: 'architecture/08-cross-cutting/',
      skill: '/cross-cutting',
    },
  },
  {
    keys: ['adr', 'decision', '09'],
    hit: { chapter: '09', path: 'architecture/09-decisions/', skill: '/decision' },
  },
  {
    keys: ['quality', '10'],
    hit: {
      chapter: '10',
      path: 'architecture/10-quality/',
      skill: '/architecture',
      note: 'stub',
    },
  },
  {
    keys: ['risk', '11'],
    hit: {
      chapter: '11',
      path: 'architecture/11-risks/',
      skill: '/architecture',
      note: 'stub',
    },
  },
  {
    keys: ['glossary', '12'],
    hit: {
      chapter: '12',
      path: 'architecture/12-glossary/',
      skill: '/architecture',
      note: 'stub',
    },
  },

]

export function routeTopic(topic: string): RouteHit[] {
  const t = topic.toLowerCase()
  const hits: RouteHit[] = []
  for (const r of ROUTES) {
    if (r.keys.some((k) => t.includes(k))) hits.push(r.hit)
  }
  if (hits.length === 0) {
    hits.push({
      chapter: '?',
      path: 'architecture/',
      skill: '/architecture',
      note: 'No keyword match — ask which chapter (01–12)',
    })
  }
  const seen = new Set<string>()
  return hits.filter((h) => {
    const k = h.skill + h.path
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
