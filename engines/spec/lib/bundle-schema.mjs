/**
 * portal-feature-bundle/v1 — design spec vs portal-gen (gen) split.
 * bundle.spec = design v1 · bundle.gen = dev-grill / portal:gen fields · ir/spec = merged
 */

export const BUNDLE_SCHEMA = 'portal-feature-bundle/v1'

export const BUNDLE_META_KEYS = [
  'id',
  'title',
  'status',
  'owner',
  'summary',
  'specOrigin',
  'grillStatus'
]

/** Top-level keys in spec/gen that belong in ir/spec for portal:gen — not design v1 authoring */
export const GEN_TOP_KEYS = ['codegen', 'tags']

/** ui.* keys owned by dev-grill / portal:gen */
export const GEN_UI_KEYS = ['filters', 'columns', 'composition', 'testIds']

/**
 * @param {Record<string, unknown>} specSection
 * @param {Record<string, unknown>} [bundleGen]
 */
export function partitionSpecSection(specSection = {}, bundleGen = {}) {
  const designSpec = { ...specSection }
  const gen = structuredClone(bundleGen ?? {})

  for (const key of GEN_TOP_KEYS) {
    if (designSpec[key] != null && gen[key] == null) gen[key] = designSpec[key]
    delete designSpec[key]
  }

  if (designSpec.ui && typeof designSpec.ui === 'object') {
    gen.ui = gen.ui ?? {}
    const ui = { ...designSpec.ui }
    for (const key of GEN_UI_KEYS) {
      if (ui[key] != null && gen.ui[key] == null) gen.ui[key] = ui[key]
      delete ui[key]
    }
    designSpec.ui = ui
  }

  return { designSpec, gen: pruneGen(gen) }
}

/**
 * Merge design spec + gen → flat ir/spec shape (portal:gen input).
 * @param {Record<string, unknown>} meta
 * @param {Record<string, unknown>} designSpec
 * @param {Record<string, unknown>} gen
 */
export function mergeIrSpec(meta, designSpec = {}, gen = {}) {
  const ir = { ...meta, ...designSpec }

  for (const key of GEN_TOP_KEYS) {
    if (gen[key] != null) ir[key] = gen[key]
  }

  if (gen.ui && typeof gen.ui === 'object') {
    ir.ui = { ...(ir.ui ?? {}) }
    for (const key of GEN_UI_KEYS) {
      if (gen.ui[key] != null) ir.ui[key] = gen.ui[key]
    }
  }

  return ir
}

/**
 * @param {Record<string, unknown>} irSpec
 */
export function partitionIrSpec(irSpec = {}) {
  const meta = {}
  for (const key of BUNDLE_META_KEYS) {
    if (irSpec[key] != null) meta[key] = irSpec[key]
  }
  if (irSpec.openQuestions != null) meta.openQuestions = irSpec.openQuestions

  const specBody = { ...irSpec }
  for (const key of [...BUNDLE_META_KEYS, 'openQuestions']) delete specBody[key]

  const { designSpec, gen } = partitionSpecSection(specBody, {})
  return { meta, designSpec, gen }
}

function pruneGen(gen) {
  const out = { ...gen }
  if (out.ui && !Object.keys(out.ui).length) delete out.ui
  if (!Object.keys(out).length) return {}
  return out
}

export function hasGenContent(gen = {}) {
  if (!gen || typeof gen !== 'object') return false
  if (GEN_TOP_KEYS.some((k) => gen[k] != null)) return true
  if (gen.ui && GEN_UI_KEYS.some((k) => gen.ui[k] != null)) return true
  return false
}
