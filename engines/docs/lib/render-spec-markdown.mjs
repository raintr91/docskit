import { stringify } from 'yaml'
import { renderTable } from './markdown-table.mjs'
import { MD_NONE } from './markdown-table.mjs'
import { renderScreenLink } from './route-page-probe.mjs'

const SKIP_BODY_KEYS = new Set(['id', 'title', 'summary', 'acceptance'])

/**
 * @param {Record<string, unknown>} spec
 * @param {{
 *   testcases: Array<{ file: string, data: Record<string, unknown> }>,
 *   output: { testcasesDir: string, specFile: string },
 *   devAppBaseUrl: string,
 *   projectRoot: string
 * }} context
 */
export function renderSpecMarkdown(spec, context) {
  const header = renderHeader(spec, context)
  const body = renderBody(spec)

  return body ? `${header}\n\n${body}\n` : `${header}\n`
}

function renderHeader(spec, { testcases, output, devAppBaseUrl, projectRoot }) {
  const title = spec.title ?? spec.id
  const lines = [`# ${title}`, '', renderTestcaseLine(testcases, output), renderScreenLine(spec, devAppBaseUrl, projectRoot)]

  if (spec.summary) {
    lines.push('', String(spec.summary))
  }

  return lines.join('\n')
}

function renderTestcaseLine(testcases, _output) {
  if (!testcases?.length) {
    // R3: plans SSOT on tests hub — design render does not emit case MD
    return '- **Testcase plans:** [base_test](https://github.com/raintr91/base_test) (`pnpm cases:render` on tests hub) — see docs-hub TESTS-HUB'
  }

  const links = testcases.map(({ file, data }) => {
    const label = data.title ?? data.id ?? file
    return `\`${label}\``
  })

  return `- **Testcase plans:** ${links.join(' · ')} (hub: [base_test](https://github.com/raintr91/base_test))`
}

function renderScreenLine(spec, devAppBaseUrl, projectRoot) {
  const route = spec.ui?.routes?.[0]
  const path = route?.path ?? ''
  const testId = route?.pageTestId ?? ''

  if (!path) {
    return `- **Screen:** ${MD_NONE}`
  }

  const screen = renderScreenLink(path, devAppBaseUrl, projectRoot)
  const suffix = testId ? ` · \`${testId}\`` : ''

  return `- **Screen:** ${screen}${suffix}`
}

function renderBody(spec) {
  return Object.entries(spec)
    .filter(([key, value]) => !SKIP_BODY_KEYS.has(key) && value != null)
    .map(([key, value]) => {
      if (key === 'ui' && value && typeof value === 'object') return renderUiSection(value)
      return renderSection(key, value)
    })
    .filter(Boolean)
    .join('\n\n')
}

function renderSection(key, value) {
  const title = `## ${key}`

  if (isEmpty(value)) {
    return `${title}\n\n${MD_NONE}`
  }

  if (typeof value === 'string') {
    return `${title}\n\n${value}`
  }

  return `${title}\n\n\`\`\`yaml\n${stringify(value).trim()}\n\`\`\``
}

function renderUiSection(ui) {
  const parts = ['## ui', '']
  const uiCopy = { ...ui }

  if (uiCopy.routes) {
    parts.push('### routes', '', renderYamlBlock(uiCopy.routes), '')
    delete uiCopy.routes
  }

  if (uiCopy.validationMessages) {
    parts.push('### validationMessages', '', renderYamlBlock(uiCopy.validationMessages), '')
    delete uiCopy.validationMessages
  }

  if (uiCopy.list) {
    parts.push('### list', '', renderPageBlock(uiCopy.list, 'list'), '')
    delete uiCopy.list
  }

  if (uiCopy.form) {
    parts.push('### form', '', renderPageBlock(uiCopy.form, 'form'), '')
    delete uiCopy.form
  }

  if (uiCopy.detail) {
    parts.push('### detail', '', renderPageBlock(uiCopy.detail, 'detail'), '')
    delete uiCopy.detail
  }

  if (Object.keys(uiCopy).length) {
    parts.push('### ui (other)', '', renderYamlBlock(uiCopy), '')
  }

  return parts.filter(Boolean).join('\n\n')
}

function renderPageBlock(block, kind) {
  if (!block || typeof block !== 'object' || !Object.keys(block).length) return MD_NONE

  if (kind === 'form') {
    const rows = (block.fields ?? []).map((field) => [
      field.key ?? '',
      field.label ?? '',
      field.type ?? '',
      field.widget ?? '',
      field.required ? 'yes' : '',
      formatSource(field.source),
      formatValidation(field.validation),
      formatMessages(field.messages)
    ])

    const table = rows.length
      ? renderTable(['Key', 'Label', 'Type', 'Widget', 'Req', 'Source', 'Validation', 'Messages'], rows)
      : MD_NONE

    const sections = []
    if (block.layout) sections.push('**Layout:**', '', renderYamlBlock(block.layout), '')
    if (block.sections?.length) sections.push('**Sections:**', '', renderYamlBlock(block.sections), '')
    sections.push('**Fields:**', '', table)
    if (block.submit) sections.push('', '**Submit:**', '', renderYamlBlock(block.submit))
    if (block.emptyState) sections.push('', '**Empty state:**', '', renderYamlBlock(block.emptyState))
    return sections.filter(Boolean).join('\n\n')
  }

  if (kind === 'list') {
    const rows = (block.columns ?? []).map((column) => [
      column.key ?? '',
      column.title ?? '',
      column.sortable ? 'yes' : '',
      column.render ?? '',
      column.component ?? '',
      column.componentProp ?? ''
    ])
    const table = rows.length
      ? renderTable(['Key', 'Title', 'Sortable', 'Render', 'Component', 'Prop'], rows)
      : MD_NONE
    const sections = []
    if (block.titleField) sections.push(`**Title field:** \`${block.titleField}\``, '')
    if (block.subtitleField) sections.push(`**Subtitle field:** \`${block.subtitleField}\``, '')
    if (block.filters?.length) sections.push('**Filters:**', '', renderYamlBlock(block.filters), '')
    sections.push('**Columns:**', '', table)
    if (block.rowActions?.length) sections.push('', '**Row actions:**', '', renderYamlBlock(block.rowActions))
    if (block.bulkActions?.length) sections.push('', '**Bulk actions:**', '', renderYamlBlock(block.bulkActions))
    if (block.pagination) sections.push('', '**Pagination:**', '', renderYamlBlock(block.pagination))
    if (block.emptyState) sections.push('', '**Empty state:**', '', renderYamlBlock(block.emptyState))
    return sections.filter(Boolean).join('\n\n')
  }

  if (kind === 'detail') {
    const sections = []
    if (block.header) sections.push('**Header:**', '', renderYamlBlock(block.header), '')
    if (block.sections?.length) sections.push('**Sections:**', '', renderYamlBlock(block.sections), '')
    if (block.actions?.length) sections.push('**Actions:**', '', renderYamlBlock(block.actions), '')
    if (block.emptyState) sections.push('**Empty state:**', '', renderYamlBlock(block.emptyState))
    return sections.filter(Boolean).join('\n\n') || MD_NONE
  }

  return renderYamlBlock(block)
}

function renderYamlBlock(value) {
  return `\`\`\`yaml\n${stringify(value).trim()}\n\`\`\``
}

function formatSource(source) {
  if (!source || typeof source !== 'object') return ''
  const parts = [source.kind, source.ref].filter(Boolean)
  return parts.join(': ')
}

function formatValidation(validation) {
  if (!validation || typeof validation !== 'object') return ''
  const parts = []
  if (validation.minLength != null) parts.push(`minLength=${validation.minLength}`)
  if (validation.maxLength != null) parts.push(`maxLength=${validation.maxLength}`)
  if (validation.min != null) parts.push(`min=${validation.min}`)
  if (validation.max != null) parts.push(`max=${validation.max}`)
  if (validation.pattern) parts.push(`pattern=${validation.pattern}`)
  return parts.join(', ')
}

function formatMessages(messages) {
  if (!messages || typeof messages !== 'object') return ''
  return Object.entries(messages)
    .filter(([, value]) => value != null && String(value).trim())
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ')
}

function isEmpty(value) {
  if (value == null) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}
