import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const skillsToDelete = [
  'component',
  'containers',
  'context',
  'legacy-spec',
  'update-spec-legacy',
  'dynamics'
]

for (const skill of skillsToDelete) {
  const harnessPath = path.join(root, 'harness', 'cursor', 'skills', skill)
  const examplesPath = path.join(root, 'examples', 'cursor', 'skills', skill)
  
  if (fs.existsSync(harnessPath)) {
    fs.rmSync(harnessPath, { recursive: true, force: true })
    console.log(`Deleted harness skill: ${skill}`)
  }
  if (fs.existsSync(examplesPath)) {
    fs.rmSync(examplesPath, { recursive: true, force: true })
    console.log(`Deleted examples skill: ${skill}`)
  }
}
