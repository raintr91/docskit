#!/usr/bin/env node
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const check = process.argv.includes('--check')
const sourceRoot = path.join(root, 'harness', 'cursor')

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const file = path.join(dir, name)
    if (statSync(file).isDirectory()) out.push(...walk(file))
    else out.push(file)
  }
  return out
}

const mirrors = []
for (const source of walk(sourceRoot)) {
  const rel = path.relative(sourceRoot, source)
  if (rel === path.join('extracts', 'extract-registry.docskit.json')) continue
  const posix = rel.split(path.sep).join('/')
  mirrors.push([`harness/cursor/${posix}`, `examples/cursor/${posix}`])
  mirrors.push([`harness/cursor/${posix}`, `.cursor/${posix}`])
}

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
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, source, 'utf8')
  }
}

if (drift.length) {
  console.error(`Cursor harness example drift:\n${drift.map((file) => `  ${file}`).join('\n')}`)
  process.exit(1)
}
