import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const filesToRemove = [
  '.cursor/extracts/tpl-component.md',
  '.cursor/extracts/tpl-journey.md',
  'examples/cursor/extracts/tpl-component.md',
  'examples/cursor/extracts/tpl-journey.md',
  'harness/cursor/extracts/tpl-component.md',
  'harness/cursor/extracts/tpl-journey.md'
]

let deletedCount = 0

for (const file of filesToRemove) {
  const absPath = path.join(root, file)
  if (fs.existsSync(absPath)) {
    fs.rmSync(absPath, { force: true })
    console.log('Removed:', file)
    deletedCount++
  }
}

console.log(`Deleted ${deletedCount} obsolete extract files.`)
