#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const mirrors = [
  ['harness/cursor/skills/hubdocs/SKILL.md', 'examples/cursor/SKILL.md'],
  ['harness/cursor/rules/hubdocs.mdc', 'examples/cursor/hubdocs.mdc'],
  [
    'harness/cursor/extracts/hubdocs-phase-hooks.md',
    'examples/cursor/hubdocs-phase-hooks.md',
  ],
  ['harness/cursor/skills/hubdocs/SKILL.md', '.cursor/skills/hubdocs/SKILL.md'],
  ['harness/cursor/rules/hubdocs.mdc', '.cursor/rules/hubdocs.mdc'],
  [
    'harness/cursor/extracts/hubdocs-phase-hooks.md',
    '.cursor/extracts/hubdocs-phase-hooks.md',
  ],
]

const drift = []
for (const [sourceRel, targetRel] of mirrors) {
  const source = readFileSync(path.join(root, sourceRel), 'utf8')
  const target = path.join(root, targetRel)
  if (check) {
    let current = ''
    try {
      current = readFileSync(target, 'utf8')
    } catch {
      // Missing mirror is drift.
    }
    if (current !== source) drift.push(targetRel)
  } else {
    writeFileSync(target, source, 'utf8')
  }
}

if (drift.length) {
  console.error(`Cursor harness example drift:\n${drift.map((file) => `  ${file}`).join('\n')}`)
  process.exit(1)
}
