import path from 'node:path'
import { renderSpecMarkdown } from './render-spec-markdown.mjs'

/**
 * Flatten bundle → spec shape for shared header renderer (design v1 only).
 * @param {Record<string, unknown>} bundle
 */
export function bundleToSpecShape(bundle) {
  const meta = {
    id: bundle.id,
    title: bundle.title,
    status: bundle.status,
    owner: bundle.owner,
    summary: bundle.summary ?? bundle.review?.summary
  }
  return {
    ...meta,
    ...(bundle.spec ?? {}),
    openQuestions: bundle.openQuestions ?? []
  }
}

/**
 * @param {Record<string, unknown>} bundle
 * @param {Parameters<typeof renderSpecMarkdown>[1]} context
 */
export function renderBundleMarkdown(bundle, context) {
  const specShape = {
    ...bundleToSpecShape(bundle),
    design: bundle.design,
    legacy: bundle.legacy,
    review: bundle.review,
    template: bundle.template
  }
  return renderSpecMarkdown(specShape, context)
}

export function bundleSlug(bundleFile) {
  return path.basename(bundleFile).replace(/\.bundle\.ya?ml$/, '')
}

/**
 * docs/features/yaml/admin/hotel/list/foo.bundle.yaml → docs/features/md/admin/hotel/list/foo.md
 * @param {string} bundleFile
 */
export function bundleMarkdownOutputPath(bundleFile, docsDir, yamlRoot, mdRoot) {
  const yRoot = yamlRoot ?? path.join(docsDir, 'features', 'yaml')
  const mRoot = mdRoot ?? path.join(docsDir, 'features', 'md')
  const rel = path.relative(yRoot, bundleFile)
  const mdRel = rel.replace(/\.bundle\.ya?ml$/, '.md')
  return path.join(mRoot, mdRel)
}

export function bundleTestcaseDir(bundleFile) {
  return path.dirname(bundleFile)
}
