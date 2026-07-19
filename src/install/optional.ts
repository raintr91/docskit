import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { checkboxPrompt, type CheckboxChoice } from './prompt.js'
import type { HubdocsHarnessType } from './harness.js'

export const OPTIONAL_TOOLKIT_IDS = ['artifactgraph'] as const
export type OptionalToolkitId = (typeof OPTIONAL_TOOLKIT_IDS)[number]

export interface OptionalToolkitPrompts {
  checkbox<T extends string>(opts: {
    message: string
    choices: CheckboxChoice<T>[]
  }): Promise<T[]>
}

export function parseOptionalToolkits(raw: string | undefined): OptionalToolkitId[] | undefined {
  if (raw === undefined) return undefined
  const value = raw.trim().toLowerCase()
  if (!value || value === 'none') return []

  const selected: OptionalToolkitId[] = []
  for (const token of value.split(/[,\s]+/).filter(Boolean)) {
    if (!OPTIONAL_TOOLKIT_IDS.includes(token as OptionalToolkitId)) {
      throw new Error(
        `Unknown optional toolkit "${token}". Known: ${OPTIONAL_TOOLKIT_IDS.join(', ')}, none`,
      )
    }
    const id = token as OptionalToolkitId
    if (!selected.includes(id)) selected.push(id)
  }
  return selected
}

export async function resolveOptionalToolkits(opts: {
  interactive: boolean
  requested?: OptionalToolkitId[]
  prompts?: OptionalToolkitPrompts
}): Promise<OptionalToolkitId[]> {
  if (opts.requested !== undefined) return opts.requested
  if (!opts.interactive) return []

  const prompts = opts.prompts ?? { checkbox: checkboxPrompt }
  return prompts.checkbox({
    message: 'Optional toolkits to initialize now (none = skip, add later):',
    choices: [
      {
        value: 'artifactgraph',
        name: 'ArtifactGraph — local registry/tag/parity accelerator',
        checked: false,
      },
    ],
  })
}

export interface OptionalToolkitInvocation {
  id: OptionalToolkitId
  command: string
  args: string[]
  cwd: string
}

export function optionalToolkitInvocations(opts: {
  selected: OptionalToolkitId[]
  projectRoot: string
  target: string
  type: HubdocsHarnessType
  force?: boolean
  useWsl?: boolean
}): OptionalToolkitInvocation[] {
  return opts.selected.map((id) => {
    if (id !== 'artifactgraph') {
      throw new Error(`Unsupported optional toolkit: ${String(id)}`)
    }
    return {
      id,
      command: 'artifactgraph',
      args: [
        'init',
        `--target=${opts.target || 'none'}`,
        `--type=${opts.type === 'docs' ? 'docs' : 'common'}`,
        '--location=local',
        '--yes',
        ...(opts.force ? ['--force'] : []),
        ...(opts.useWsl ? ['--wsl'] : []),
      ],
      cwd: path.resolve(opts.projectRoot),
    }
  })
}

export interface OptionalToolkitRunResult {
  initialized: OptionalToolkitId[]
  unavailable: OptionalToolkitId[]
}

/**
 * Run only explicitly selected, already-installed optional toolkits.
 * A missing executable is a non-fatal hint; Hubdocs never clones or installs
 * another toolkit implicitly. Other failures are surfaced because the member
 * explicitly requested that initialization.
 */
export function runOptionalToolkits(
  invocations: OptionalToolkitInvocation[],
): OptionalToolkitRunResult {
  const initialized: OptionalToolkitId[] = []
  const unavailable: OptionalToolkitId[] = []

  for (const invocation of invocations) {
    const result = spawnSync(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      env: process.env,
      encoding: 'utf8',
      stdio: 'inherit',
    })
    const missing =
      result.error &&
      'code' in result.error &&
      (result.error as NodeJS.ErrnoException).code === 'ENOENT'
    if (missing) {
      unavailable.push(invocation.id)
      continue
    }
    if (result.error || result.status !== 0) {
      throw new Error(
        `${invocation.command} ${invocation.args.join(' ')} failed (${
          result.status ?? 'spawn'
        })${result.error ? `: ${result.error.message}` : ''}`,
      )
    }
    initialized.push(invocation.id)
  }

  return { initialized, unavailable }
}
