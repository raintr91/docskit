#!/usr/bin/env node
/**
 * Render harness/cursor templates for the Cursor agent profile into
 * examples/cursor and .cursor — mirrors what `docskit init --target=cursor` generates.
 */
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

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

const profileMod = path.join(root, 'dist', 'install', 'agent-profile.js')
if (!existsSync(profileMod)) {
  console.error('dist/install/agent-profile.js missing — run npm run build first')
  process.exit(1)
}
const { agentHarnessProfile, renderHarnessTemplate } = await import(pathToFileURL(profileMod).href)
const { mapTemplateRelForAgent } = await import(
  pathToFileURL(path.join(root, 'dist', 'install', 'harness.js')).href
)

const profile = agentHarnessProfile('cursor')
const agentDir = '.cursor'
const TEXT_EXT = new Set(['.md', '.mdc', '.json', '.txt', '.yaml', '.yml', '.toml'])

const expected = new Map()
for (const source of walk(sourceRoot)) {
  const sourceRel = path.relative(sourceRoot, source)
  const posix = sourceRel.split(path.sep).join('/')
  if (posix === 'extracts/extract-registry.docskit.json') continue
  const mapped = mapTemplateRelForAgent(posix, profile, agentDir)
  if (!mapped) continue
  // mapped is `.cursor/...` — strip prefix for examples/cursor and .cursor mirrors
  const under = mapped.slice(`${agentDir}/`.length)
  const raw = readFileSync(source)
  const content = TEXT_EXT.has(path.extname(posix).toLowerCase())
    ? renderHarnessTemplate(raw.toString('utf8'), profile, agentDir)
    : raw.toString('utf8')
  expected.set(under, content)
}

const mirrors = ['examples/cursor', '.cursor']
const drift = []

for (const mirrorRoot of mirrors) {
  for (const [under, content] of expected) {
    const targetRel = path.join(mirrorRoot, under)
    const target = path.join(root, targetRel)
    if (check) {
      let current = ''
      try {
        current = readFileSync(target, 'utf8')
      } catch {
        // missing
      }
      if (current !== content) drift.push(targetRel)
    } else {
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, content, 'utf8')
    }
  }
  // Cursor has no AGENTS.md overlay — remove stale copy if present
  const staleAgents = path.join(root, mirrorRoot, 'AGENTS.md')
  if (!check && existsSync(staleAgents) && !expected.has('AGENTS.md')) {
    unlinkSync(staleAgents)
  }
  if (check && existsSync(staleAgents) && !expected.has('AGENTS.md')) {
    drift.push(path.join(mirrorRoot, 'AGENTS.md'))
  }
}

if (drift.length) {
  console.error(`Cursor harness example drift:\n${drift.map((file) => `  ${file}`).join('\n')}`)
  process.exit(1)
}

if (!check) console.log(`Rendered Cursor harness → examples/cursor + .cursor (${expected.size} files)`)
