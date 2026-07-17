import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { packageRoot } from '../config/docs-root.js'

const HARNESS_FILES = [
  {
    source: ['skills', 'hubdocs', 'SKILL.md'],
    target: ['.cursor', 'skills', 'hubdocs', 'SKILL.md'],
  },
  {
    source: ['rules', 'hubdocs.mdc'],
    target: ['.cursor', 'rules', 'hubdocs.mdc'],
  },
  {
    source: ['extracts', 'hubdocs-phase-hooks.md'],
    target: ['.cursor', 'extracts', 'hubdocs-phase-hooks.md'],
  },
] as const

export interface HarnessInstallResult {
  written: string[]
  unchanged: string[]
  skipped: string[]
}

export function installHarness(opts: {
  projectRoot?: string
  force?: boolean
} = {}): HarnessInstallResult {
  const projectRoot = path.resolve(opts.projectRoot ?? process.cwd())
  const sourceRoot = path.join(packageRoot(), 'harness', 'cursor')
  const result: HarnessInstallResult = { written: [], unchanged: [], skipped: [] }

  for (const file of HARNESS_FILES) {
    const source = path.join(sourceRoot, ...file.source)
    const target = path.join(projectRoot, ...file.target)
    if (!existsSync(source)) {
      throw new Error(`Packaged harness file missing: ${source}`)
    }

    const content = readFileSync(source, 'utf8')
    if (existsSync(target)) {
      const current = readFileSync(target, 'utf8')
      if (current === content) {
        result.unchanged.push(target)
        continue
      }
      if (!opts.force) {
        result.skipped.push(target)
        continue
      }
    }

    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, content, 'utf8')
    result.written.push(target)
  }

  return result
}
