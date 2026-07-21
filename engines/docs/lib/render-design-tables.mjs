import { renderTable, formatInline, MD_NONE } from './markdown-table.mjs'

/**
 * @param {Array<Record<string, unknown>>} zones
 */
export function renderZonesTable(zones = []) {
  if (!zones.length) return MD_NONE

  return renderTable(
    ['ID', 'Nhãn', 'Vị trí', 'Container', 'Ghi chú'],
    zones.map((zone) => [
      zone.id ?? '',
      zone.label ?? '',
      formatPosition(zone.position),
      formatContainer(zone.container),
      zone.hint ?? zone.notes ?? ''
    ])
  )
}

/**
 * @param {Record<string, unknown>} behavior
 */
export function renderBehaviorTable(behavior = {}) {
  const verbs = ['create', 'update', 'delete', 'duplicate', 'export', 'import']
  const rows = []

  for (const verb of verbs) {
    const block = behavior[verb]
    if (!block || typeof block !== 'object') continue
    rows.push([
      verb,
      block.enabled === false ? 'không' : 'có',
      block.surface ?? block.mode ?? block.target ?? '',
      block.confirm ?? block.mode ?? '',
      block.notes ?? ''
    ])
  }

  if (!rows.length) return MD_NONE

  return renderTable(['Hành động', 'Bật', 'Surface / mode', 'Confirm', 'Ghi chú'], rows)
}

/**
 * @param {Array<Record<string, unknown>>} actions
 */
export function renderActionsTable(actions = []) {
  if (!actions.length) return MD_NONE

  return renderTable(
    ['ID', 'Text', 'Vị trí', 'Variant', 'testId'],
    actions.map((action) => [
      action.id ?? '',
      action.text ?? '',
      action.position ?? '',
      action.variant ?? '',
      action.testId ?? action.testIdPattern ?? ''
    ])
  )
}

function formatPosition(position) {
  if (!position || typeof position !== 'object') return ''
  if (position.after) return `after: ${position.after}`
  if (position.before) return `before: ${position.before}`
  return formatInline(position)
}

function formatContainer(container) {
  if (!container || typeof container !== 'object') return ''
  const parts = []
  if (container.bordered === false) parts.push('không border')
  if (container.bordered === true) parts.push('có border')
  return parts.join(', ') || formatInline(container)
}
