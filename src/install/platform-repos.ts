import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { HUBDOCS_OWNED_SKILLS } from './harness.js'

const NON_PORTABLE = /(\.\.\/|~\/|\/home\/|[A-Za-z]:\\|\\\\)/

export function mergePlatformRepos(projectRoot: string): {
  path: string
  mergedSkills: string[]
  warnings: string[]
} {
  const root = path.resolve(projectRoot)
  const file = path.join(root, 'platform-repos.json')
  const warnings: string[] = []
  const data: any = existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf8'))
    : {
        defaultGroup: 'docs',
        harness: { profiles: { docs: { groups: ['docs'], skills: [] } } },
        groups: {
          docs: {
            description: 'Docs hub — current repository only',
            primary: path.basename(root),
            projects: [path.basename(root)],
          },
        },
        projects: {
          [path.basename(root)]: {
            root: '.',
            role: 'docs',
            repo: path.basename(root),
            write: true,
          },
        },
      }

  if (NON_PORTABLE.test(JSON.stringify(data))) {
    warnings.push(
      'platform-repos.json contains non-portable paths; move checkouts to *.local.json',
    )
  }

  data.harness ??= {}
  data.harness.profiles ??= {}
  data.harness.profiles.docs ??= { groups: ['docs'], skills: [] }
  const skills: string[] = data.harness.profiles.docs.skills ?? []
  const mergedSkills: string[] = []
  for (const skill of HUBDOCS_OWNED_SKILLS) {
    if (!skills.includes(skill)) {
      skills.push(skill)
      mergedSkills.push(skill)
    }
  }
  data.harness.profiles.docs.skills = skills
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
  return { path: file, mergedSkills, warnings }
}
