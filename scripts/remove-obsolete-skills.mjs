import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()

const obsoleteSkills = [
  'context',
  'containers',
  'system-context',
  'journey',
  'dynamics',
  'component',
  'legacy-spec'
]

const targetDirs = [
  '.cursor/skills',
  'harness/cursor/skills',
  'examples/cursor/skills'
]

let deletedCount = 0

for (const dir of targetDirs) {
  const skillsDir = join(projectRoot, dir)
  if (!existsSync(skillsDir)) continue

  for (const name of obsoleteSkills) {
    const target = join(skillsDir, name)
    if (existsSync(target)) {
      try {
        rmSync(target, { recursive: true, force: true })
        console.log(`Deleted: ${target}`)
        deletedCount++
      } catch (err) {
        console.error(`Failed to delete ${target}:`, err.message)
      }
    }
  }
}

// Special case: malformed folder names that might have been created by mistake
const malformedDirs = [
  'architecture context containers component journey deployment decision cross-cutting dynamics'
]

for (const dir of targetDirs) {
  for (const name of malformedDirs) {
    const target = join(projectRoot, dir, name)
    if (existsSync(target)) {
      try {
        rmSync(target, { recursive: true, force: true })
        console.log(`Deleted malformed dir: ${target}`)
        deletedCount++
      } catch (err) {}
    }
  }
}

console.log(`Finished. Deleted ${deletedCount} obsolete skill directories.`)
