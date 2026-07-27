import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const dirsToRemove = [
  'templates/product-skeleton/architecture/03-context',
  'templates/product-skeleton/architecture/05-building-blocks',
  'templates/product-skeleton/architecture/06-runtime',
]

for (const dir of dirsToRemove) {
  const absPath = path.join(root, dir)
  if (fs.existsSync(absPath)) {
    fs.rmSync(absPath, { recursive: true, force: true })
    console.log('Removed:', dir)
  }
}
