import path from 'node:path'
import { stringify } from 'yaml'
import { renderSpecMarkdown } from './render-spec-markdown.mjs'
import { MD_NONE } from './markdown-table.mjs'
import { renderActionsTable, renderBehaviorTable, renderZonesTable } from './render-design-tables.mjs'

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

function renderDesignSection(design) {
  if (!design || !Object.keys(design).length) return []

  const parts = ['## Design intent', '']

  if (design.inherits) {
    parts.push(`**Inherits:** \`${design.inherits}\``, '')
  }

  if (design.shell?.tag) {
    parts.push(`**Shell:** ${design.shell.tag}`, '')
  }

  if (design.patterns?.length) {
    parts.push('**Patterns:**', '', design.patterns.map((p) => `- ${p}`).join('\n'), '')
  }

  if (design.zones?.length) {
    parts.push('### Zones', '', renderZonesTable(design.zones), '')
  }

  if (design.behavior && Object.keys(design.behavior).length) {
    parts.push('### CRUD behavior', '', renderBehaviorTable(design.behavior), '')
  }

  if (design.actions?.length) {
    parts.push('### Actions', '', renderActionsTable(design.actions), '')
  }

  if (design.deviations?.length) {
    parts.push(
      '### Deviations',
      '',
      design.deviations
        .map((d) => `- ${d.tag ?? 'deviation'}: legacy \`${d.legacy ?? ''}\` → portal \`${d.portal ?? ''}\``)
        .join('\n'),
      ''
    )
  }

  const extras = { ...design }
  for (const key of [
    'inherits',
    'shell',
    'patterns',
    'zones',
    'behavior',
    'actions',
    'deviations',
    'id'
  ]) {
    delete extras[key]
  }

  if (Object.keys(extras).length) {
    parts.push('### Design (other)', '', '```yaml', stringify(extras).trim(), '```', '')
  }

  return parts
}

function renderLegacySection(legacy) {
  if (!legacy || !Object.keys(legacy).length) return []

  const parts = ['## Legacy evidence', '']

  if (legacy.behaviors?.length) {
    parts.push(
      '### Behaviors',
      '',
      '| ID | Fact | Confidence |',
      '| --- | --- | --- |',
      ...legacy.behaviors.map((b) =>
        `| ${b.id ?? ''} | \`${JSON.stringify(b.fact ?? {})}\` | ${b.confidence ?? ''} |`
      ),
      ''
    )
  }

  if (legacy.fields?.length) {
    parts.push(
      '### Fields',
      '',
      '| Name | Via | Confidence |',
      '| --- | --- | --- |',
      ...legacy.fields.map((f) => `| ${f.name ?? ''} | ${f.via ?? ''} | ${f.confidence ?? ''} |`),
      ''
    )
  }

  return parts
}

/**
 * @param {Record<string, unknown>} bundle
 * @param {Parameters<typeof renderSpecMarkdown>[1]} context
 */
export function renderBundleMarkdown(bundle, context) {
  const specShape = bundleToSpecShape(bundle)
  const parts = [renderSpecMarkdown(specShape, context)]

  if (bundle.review?.layoutNotes?.length) {
    parts.push(
      '## Review — layout notes',
      '',
      bundle.review.layoutNotes.map((line) => `- ${line}`).join('\n')
    )
  } else if (typeof bundle.review?.layoutNotes === 'string' && bundle.review.layoutNotes) {
    parts.push('## Review — layout notes', '', `- ${bundle.review.layoutNotes}`)
  }

  parts.push(...renderDesignSection(bundle.design))
  parts.push(...renderLegacySection(bundle.legacy))

  const body = parts.filter(Boolean).join('\n\n')
  return body.endsWith('\n') ? body : `${body}\n`
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

export { MD_NONE }
