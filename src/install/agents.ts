/**
 * Wire Hubdocs MCP into supported agent configurations.
 *
 * Agents: claude | cursor | codex | opencode | hermes | gemini | antigravity | kiro | kilo
 *
 * Interactive TTY: ↑↓ + Space toggle + Enter
 * Non-interactive: --yes / --target=csv|auto|all
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { packageRoot, defaultHubdocsRoot, looksLikeHub } from '../config/docs-root.js'
import { checkboxPrompt, selectPrompt } from './prompt.js'
import { buildTomlTable, upsertTomlTable, removeTomlTable } from './toml.js'

export type AgentId =
  | 'claude'
  | 'cursor'
  | 'codex'
  | 'opencode'
  | 'hermes'
  | 'gemini'
  | 'antigravity'
  | 'kiro'
  | 'kilo'

export type InstallLocation = 'global' | 'local'

export const AGENT_IDS: AgentId[] = [
  'claude',
  'cursor',
  'codex',
  'opencode',
  'hermes',
  'gemini',
  'antigravity',
  'kiro',
  'kilo',
]

const AGENT_LABEL: Record<AgentId, string> = {
  claude: 'Claude Code',
  cursor: 'Cursor',
  codex: 'Codex CLI',
  opencode: 'opencode',
  hermes: 'Hermes Agent',
  gemini: 'Gemini CLI',
  antigravity: 'Antigravity IDE',
  kiro: 'Kiro',
  kilo: 'Kilo Code',
}

const AGENT_ALIASES: Record<string, AgentId> = {
  claude: 'claude',
  cursor: 'cursor',
  codex: 'codex',
  opencode: 'opencode',
  hermes: 'hermes',
  gemini: 'gemini',
  antigravity: 'antigravity',
  agy: 'antigravity',
  'google-antigravity': 'antigravity',
  kiro: 'kiro',
  kilo: 'kilo',
}

const GLOBAL_ONLY: ReadonlySet<AgentId> = new Set(['codex', 'hermes', 'antigravity'])

const MCP_NAME = 'hubdocs'

export interface InstallOptions {
  target?: string
  location?: InstallLocation
  yes?: boolean
  useWsl?: boolean
  mcpFile?: string
  printConfig?: string
  /** Override HUBDOCS_ROOT written into agent MCP env */
  docsRoot?: string
}

export interface InstallResult {
  targets: AgentId[]
  location: InstallLocation
  written: Array<{ agent: AgentId; path: string }>
  skipped: string[]
}

type StdioEntry = {
  type?: string
  command: string
  args: string[]
  env?: Record<string, string>
}

export function buildMcpEntry(
  opts: { useWsl?: boolean; docsRoot?: string; location?: InstallLocation } = {},
): StdioEntry {
  const root = packageRoot()
  const mcpJs = path.join(root, 'bin', 'hubdocs-mcp.mjs')
  const nodeBin = process.execPath
  const location = opts.location ?? 'local'
  const hubRoot =
    opts.docsRoot ? path.resolve(opts.docsRoot) : location === 'local' ? defaultHubdocsRoot() : ''
  if (hubRoot && !looksLikeHub(hubRoot)) {
    throw new Error(`Docs hub missing architecture/: ${hubRoot}`)
  }
  if (location === 'local' && !hubRoot) {
    throw new Error(
      'No docs hub found. cd into a docs hub (folder with architecture/) and run:\n' +
        '  hubdocs init --location=local --yes\n' +
        'Or pass --docs-root=/absolute/path/to/docs-hub.',
    )
  }
  const env = hubRoot ? { HUBDOCS_ROOT: hubRoot } : undefined
  const winMcp = detectWindowsCursorMcpPath()
  const forceWsl =
    opts.useWsl ||
    process.env.HUBDOCS_MCP_WSL === '1' ||
    Boolean(process.env.WSL_DISTRO_NAME && winMcp)

  if (forceWsl) {
    return {
      type: 'stdio',
      command: 'wsl.exe',
      args: ['-e', 'bash', '-lc', `exec '${nodeBin}' '${mcpJs}'`],
      env,
    }
  }

  return {
    type: 'stdio',
    command: nodeBin,
    args: [mcpJs],
    env,
  }
}

export function mcpEntryForAgent(agent: AgentId, entry: StdioEntry): StdioEntry {
  if (agent === 'antigravity') {
    return { command: entry.command, args: entry.args, env: entry.env }
  }
  return entry
}

export function defaultCursorMcpPath(): string {
  const win = detectWindowsCursorMcpPath()
  if (win) return win
  return path.join(os.homedir(), '.cursor', 'mcp.json')
}

export function detectWindowsCursorMcpPath(): string | undefined {
  const usersRoot = '/mnt/c/Users'
  if (!existsSync(usersRoot)) return undefined
  try {
    const names = readdirSync(usersRoot).filter(
      (n) => !n.startsWith('.') && n !== 'Public' && n !== 'Default' && n !== 'All Users',
    )
    for (const name of names) {
      const candidate = path.join(usersRoot, name, '.cursor', 'mcp.json')
      const dir = path.join(usersRoot, name, '.cursor')
      if (existsSync(candidate) || existsSync(dir)) return candidate
    }
  } catch {
    /* ignore */
  }
  return undefined
}

export function defaultAntigravityMcpPath(): string {
  const win = detectWindowsAntigravityMcpPath()
  if (win) return win
  const unified = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json')
  const legacy = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json')
  const migrated = path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json.migrated')
  if (existsSync(migrated) || existsSync(unified) || existsSync(path.dirname(unified))) {
    return unified
  }
  if (existsSync(legacy) || existsSync(path.dirname(legacy))) return legacy
  return unified
}

export function detectWindowsAntigravityMcpPath(): string | undefined {
  const usersRoot = '/mnt/c/Users'
  if (!existsSync(usersRoot)) return undefined
  try {
    const names = readdirSync(usersRoot).filter(
      (n) => !n.startsWith('.') && n !== 'Public' && n !== 'Default' && n !== 'All Users',
    )
    for (const name of names) {
      const base = path.join(usersRoot, name, '.gemini')
      const unified = path.join(base, 'config', 'mcp_config.json')
      const unifiedDir = path.join(base, 'config')
      if (existsSync(unified) || existsSync(unifiedDir)) return unified
      const legacy = path.join(base, 'antigravity', 'mcp_config.json')
      const legacyDir = path.join(base, 'antigravity')
      if (existsSync(legacy) || existsSync(legacyDir)) return legacy
    }
  } catch {
    /* ignore */
  }
  return undefined
}

function xdgConfigHome(): string {
  const xdg = process.env.XDG_CONFIG_HOME?.trim()
  return xdg && xdg.length > 0 ? xdg : path.join(os.homedir(), '.config')
}

function hermesHome(): string {
  return process.env.HERMES_HOME
    ? path.resolve(process.env.HERMES_HOME)
    : path.join(os.homedir(), '.hermes')
}

function opencodeConfigPath(location: InstallLocation, cwd: string): string {
  const dir = location === 'global' ? path.join(xdgConfigHome(), 'opencode') : cwd
  const jsonc = path.join(dir, 'opencode.jsonc')
  const json = path.join(dir, 'opencode.json')
  if (existsSync(jsonc)) return jsonc
  if (existsSync(json)) return json
  return jsonc
}

export function supportsLocation(agent: AgentId, location: InstallLocation): boolean {
  if (location === 'local' && GLOBAL_ONLY.has(agent)) return false
  return true
}

export function agentConfigPath(
  agent: AgentId,
  location: InstallLocation,
  cwd = process.cwd(),
): string {
  if (location === 'local') {
    switch (agent) {
      case 'cursor':
        return path.join(cwd, '.cursor', 'mcp.json')
      case 'claude':
        return path.join(cwd, '.claude.json')
      case 'gemini':
        return path.join(cwd, '.gemini', 'settings.json')
      case 'kiro':
        return path.join(cwd, '.kiro', 'settings', 'mcp.json')
      case 'opencode':
        return opencodeConfigPath('local', cwd)
      case 'kilo':
        return path.join(cwd, '.kilocode', 'mcp.json')
      case 'codex':
        return path.join(os.homedir(), '.codex', 'config.toml')
      case 'hermes':
        return path.join(hermesHome(), 'config.yaml')
      case 'antigravity':
        return defaultAntigravityMcpPath()
    }
  }

  switch (agent) {
    case 'cursor':
      return defaultCursorMcpPath()
    case 'claude':
      return path.join(os.homedir(), '.claude.json')
    case 'codex':
      return path.join(os.homedir(), '.codex', 'config.toml')
    case 'opencode':
      return opencodeConfigPath('global', cwd)
    case 'hermes':
      return path.join(hermesHome(), 'config.yaml')
    case 'gemini':
      return path.join(os.homedir(), '.gemini', 'settings.json')
    case 'antigravity':
      return defaultAntigravityMcpPath()
    case 'kiro':
      return path.join(os.homedir(), '.kiro', 'settings', 'mcp.json')
    case 'kilo':
      return path.join(os.homedir(), '.kilocode', 'mcp.json')
  }
}

export function detectAgents(cwd = process.cwd()): AgentId[] {
  const found: AgentId[] = []

  if (
    existsSync(path.join(os.homedir(), '.claude.json')) ||
    existsSync(path.join(os.homedir(), '.claude')) ||
    existsSync(path.join(cwd, '.claude.json')) ||
    existsSync(path.join(cwd, '.mcp.json'))
  ) {
    found.push('claude')
  }
  if (
    existsSync(path.join(os.homedir(), '.cursor')) ||
    existsSync(path.join(cwd, '.cursor')) ||
    Boolean(detectWindowsCursorMcpPath())
  ) {
    found.push('cursor')
  }
  if (existsSync(path.join(os.homedir(), '.codex'))) found.push('codex')
  if (
    existsSync(path.join(xdgConfigHome(), 'opencode')) ||
    existsSync(path.join(cwd, 'opencode.jsonc')) ||
    existsSync(path.join(cwd, 'opencode.json'))
  ) {
    found.push('opencode')
  }
  if (existsSync(hermesHome()) || existsSync(path.join(hermesHome(), 'config.yaml'))) {
    found.push('hermes')
  }
  if (
    existsSync(path.join(os.homedir(), '.gemini')) ||
    existsSync(path.join(cwd, '.gemini')) ||
    existsSync(path.join(cwd, 'GEMINI.md'))
  ) {
    found.push('gemini')
  }
  if (
    existsSync(path.join(os.homedir(), '.gemini', 'antigravity')) ||
    existsSync(path.join(os.homedir(), '.gemini', 'config')) ||
    existsSync(path.join(os.homedir(), '.antigravity-ide-server')) ||
    existsSync(path.join(cwd, '.gemini', 'antigravity')) ||
    Boolean(detectWindowsAntigravityMcpPath())
  ) {
    found.push('antigravity')
  }
  if (existsSync(path.join(os.homedir(), '.kiro')) || existsSync(path.join(cwd, '.kiro'))) {
    found.push('kiro')
  }
  if (
    existsSync(path.join(os.homedir(), '.kilocode')) ||
    existsSync(path.join(cwd, '.kilocode')) ||
    existsSync(path.join(cwd, '.kilo'))
  ) {
    found.push('kilo')
  }

  return found
}

export function parseTargets(raw: string | undefined, detected: AgentId[]): AgentId[] {
  const v = (raw ?? '').trim().toLowerCase()
  if (!v || v === 'auto') return detected.length ? detected : (['cursor'] as AgentId[])
  if (v === 'all') return [...AGENT_IDS]
  if (v === 'none') return []
  const out: AgentId[] = []
  for (const part of v.split(/[,\s]+/).filter(Boolean)) {
    const id = AGENT_ALIASES[part]
    if (!id) {
      throw new Error(
        `Unknown target "${part}". Known: ${AGENT_IDS.join(', ')}, agy, auto, all`,
      )
    }
    if (!out.includes(id)) out.push(id)
  }
  return out
}

export function formatPrintConfig(
  agent: AgentId,
  location: InstallLocation,
  docsRoot?: string,
): string {
  if (!supportsLocation(agent, location)) {
    return `# ${AGENT_LABEL[agent]} has no project-local config — use --location=global.\n`
  }
  const file = agentConfigPath(agent, location)
  const entry = mcpEntryForAgent(agent, buildMcpEntry({ docsRoot, location }))

  if (agent === 'codex') {
    const values: Record<string, string | string[]> = {
      command: entry.command,
      args: entry.args,
    }
    const block = buildTomlTable(`mcp_servers.${MCP_NAME}`, values)
    const envBlock = entry.env
      ? `\n[mcp_servers.${MCP_NAME}.env]\n` +
        Object.entries(entry.env)
          .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
          .join('\n') +
        '\n'
      : ''
    return `# Add to ${file}\n\n${block}${envBlock}\n`
  }

  if (agent === 'opencode') {
    const doc = {
      $schema: 'https://opencode.ai/config.json',
      mcp: {
        [MCP_NAME]: {
          type: 'local',
          command: [entry.command, ...entry.args],
          enabled: true,
          environment: entry.env,
        },
      },
    }
    return `# Add to ${file}\n\n${JSON.stringify(doc, null, 2)}\n`
  }

  if (agent === 'hermes') {
    return [
      `# Add to ${file}`,
      '',
      'mcp_servers:',
      `  ${MCP_NAME}:`,
      `    command: ${JSON.stringify(entry.command)}`,
      '    args:',
      ...entry.args.map((a) => `      - ${JSON.stringify(a)}`),
      '    timeout: 120',
      '    connect_timeout: 60',
      '    enabled: true',
      '',
      'platform_toolsets:',
      '  cli:',
      '    - hermes-cli',
      `    - mcp-${MCP_NAME}`,
      '',
    ].join('\n')
  }

  const doc = { mcpServers: { [MCP_NAME]: entry } }
  return `# Add to ${file}\n\n${JSON.stringify(doc, null, 2)}\n`
}

export function mergeMcpJson(file: string, entry: StdioEntry): string {
  mkdirSync(path.dirname(file), { recursive: true })
  let doc: { mcpServers?: Record<string, unknown> } = {}
  if (existsSync(file)) {
    const raw = readFileSync(file, 'utf8').trim()
    if (raw) {
      doc = JSON.parse(raw) as typeof doc
    }
  }
  doc.mcpServers ??= {}
  doc.mcpServers[MCP_NAME] = entry
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  return file
}

function mergeCodexToml(file: string, entry: StdioEntry): string {
  mkdirSync(path.dirname(file), { recursive: true })
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : ''
  const block = buildTomlTable(`mcp_servers.${MCP_NAME}`, {
    command: entry.command,
    args: entry.args,
  })
  let { content } = upsertTomlTable(existing, `mcp_servers.${MCP_NAME}`, block)
  if (entry.env && Object.keys(entry.env).length) {
    const envHeader = `mcp_servers.${MCP_NAME}.env`
    const envBody = Object.entries(entry.env)
      .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
      .join('\n')
    const envBlock = `[${envHeader}]\n${envBody}`
    ;({ content } = upsertTomlTable(content, envHeader, envBlock))
  }
  writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
  return file
}

function parseJsonLoose(raw: string): Record<string, unknown> {
  const stripped = raw.replace(/^\s*\/\/.*$/gm, '')
  if (!stripped.trim()) return {}
  return JSON.parse(stripped) as Record<string, unknown>
}

function mergeOpencodeConfig(file: string, entry: StdioEntry): string {
  mkdirSync(path.dirname(file), { recursive: true })
  let doc: Record<string, unknown> = { $schema: 'https://opencode.ai/config.json' }
  if (existsSync(file)) {
    const raw = readFileSync(file, 'utf8')
    if (raw.trim()) {
      try {
        doc = parseJsonLoose(raw)
      } catch {
        /* keep schema default */
      }
    }
  }
  doc.$schema ??= 'https://opencode.ai/config.json'
  const mcp = (doc.mcp as Record<string, unknown> | undefined) ?? {}
  mcp[MCP_NAME] = {
    type: 'local',
    command: [entry.command, ...entry.args],
    enabled: true,
    environment: entry.env,
  }
  doc.mcp = mcp
  writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  return file
}

function mergeHermesYaml(file: string, entry: StdioEntry): string {
  mkdirSync(path.dirname(file), { recursive: true })
  let doc: Record<string, unknown> = {}
  if (existsSync(file)) {
    const raw = readFileSync(file, 'utf8')
    if (raw.trim()) {
      try {
        doc = (parseYaml(raw) as Record<string, unknown>) ?? {}
      } catch {
        doc = {}
      }
    }
  }

  const servers = (doc.mcp_servers as Record<string, unknown> | undefined) ?? {}
  servers[MCP_NAME] = {
    command: entry.command,
    args: entry.args,
    env: entry.env,
    timeout: 120,
    connect_timeout: 60,
    enabled: true,
  }
  doc.mcp_servers = servers

  const toolsets = (doc.platform_toolsets as Record<string, unknown> | undefined) ?? {}
  const cli = Array.isArray(toolsets.cli) ? [...(toolsets.cli as unknown[])] : ['hermes-cli']
  const tool = `mcp-${MCP_NAME}`
  if (!cli.includes(tool)) cli.push(tool)
  toolsets.cli = cli
  doc.platform_toolsets = toolsets

  writeFileSync(file, stringifyYaml(doc), 'utf8')
  return file
}

function writeAgentConfig(
  agent: AgentId,
  location: InstallLocation,
  entry: StdioEntry,
): string {
  const file = agentConfigPath(agent, location)
  const shaped = mcpEntryForAgent(agent, entry)

  switch (agent) {
    case 'codex':
      return mergeCodexToml(file, shaped)
    case 'opencode':
      return mergeOpencodeConfig(file, shaped)
    case 'hermes':
      return mergeHermesYaml(file, shaped)
    default:
      return mergeMcpJson(file, shaped)
  }
}

export function mergeClaudePermissions(
  location: InstallLocation,
  cwd = process.cwd(),
): string | null {
  const settings =
    location === 'local'
      ? path.join(cwd, '.claude', 'settings.json')
      : path.join(os.homedir(), '.claude', 'settings.json')
  mkdirSync(path.dirname(settings), { recursive: true })
  let doc: { permissions?: { allow?: string[] } } = {}
  if (existsSync(settings)) {
    try {
      doc = JSON.parse(readFileSync(settings, 'utf8')) as typeof doc
    } catch {
      doc = {}
    }
  }
  doc.permissions ??= {}
  doc.permissions.allow ??= []
  const wild = `mcp__${MCP_NAME}__*`
  if (!doc.permissions.allow.includes(wild)) {
    doc.permissions.allow.push(wild)
    writeFileSync(settings, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
    return settings
  }
  return null
}

function removeMcpJson(file: string, dryRun: boolean): boolean {
  if (!existsSync(file)) return false
  const raw = readFileSync(file, 'utf8').trim()
  if (!raw) return false
  let doc: { mcpServers?: Record<string, unknown> }
  try {
    doc = JSON.parse(raw) as typeof doc
  } catch {
    return false
  }
  if (!doc.mcpServers || !(MCP_NAME in doc.mcpServers)) return false
  if (!dryRun) {
    delete doc.mcpServers[MCP_NAME]
    writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  }
  return true
}

function removeCodexToml(file: string, dryRun: boolean): boolean {
  if (!existsSync(file)) return false
  const existing = readFileSync(file, 'utf8')
  const server = removeTomlTable(existing, `mcp_servers.${MCP_NAME}`)
  const env = removeTomlTable(server.content, `mcp_servers.${MCP_NAME}.env`)
  const removed = server.removed || env.removed
  if (removed && !dryRun) {
    const content = env.content
    writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`, 'utf8')
  }
  return removed
}

function removeOpencodeConfig(file: string, dryRun: boolean): boolean {
  if (!existsSync(file)) return false
  const raw = readFileSync(file, 'utf8')
  if (!raw.trim()) return false
  let doc: Record<string, unknown>
  try {
    doc = parseJsonLoose(raw)
  } catch {
    return false
  }
  const mcp = doc.mcp as Record<string, unknown> | undefined
  if (!mcp || !(MCP_NAME in mcp)) return false
  if (!dryRun) {
    delete mcp[MCP_NAME]
    doc.mcp = mcp
    writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  }
  return true
}

function removeHermesYaml(file: string, dryRun: boolean): boolean {
  if (!existsSync(file)) return false
  const raw = readFileSync(file, 'utf8')
  if (!raw.trim()) return false
  let doc: Record<string, unknown>
  try {
    doc = (parseYaml(raw) as Record<string, unknown>) ?? {}
  } catch {
    return false
  }
  const servers = doc.mcp_servers as Record<string, unknown> | undefined
  const toolsets = doc.platform_toolsets as Record<string, unknown> | undefined
  const tool = `mcp-${MCP_NAME}`
  const cli = toolsets && Array.isArray(toolsets.cli) ? (toolsets.cli as unknown[]) : []
  const hasServer = Boolean(servers && MCP_NAME in servers)
  const hasTool = cli.includes(tool)
  if (!hasServer && !hasTool) return false
  if (!dryRun) {
    if (hasServer) delete servers![MCP_NAME]
    if (hasTool) toolsets!.cli = cli.filter((x) => x !== tool)
    writeFileSync(file, stringifyYaml(doc), 'utf8')
  }
  return true
}

export function removeClaudePermissions(
  location: InstallLocation,
  dryRun: boolean,
  cwd = process.cwd(),
): string | null {
  const settings =
    location === 'local'
      ? path.join(cwd, '.claude', 'settings.json')
      : path.join(os.homedir(), '.claude', 'settings.json')
  if (!existsSync(settings)) return null
  let doc: { permissions?: { allow?: string[] } }
  try {
    doc = JSON.parse(readFileSync(settings, 'utf8')) as typeof doc
  } catch {
    return null
  }
  const allow = doc.permissions?.allow
  const wild = `mcp__${MCP_NAME}__*`
  if (!allow || !allow.includes(wild)) return null
  if (!dryRun) {
    doc.permissions!.allow = allow.filter((a) => a !== wild)
    writeFileSync(settings, `${JSON.stringify(doc, null, 2)}\n`, 'utf8')
  }
  return settings
}

function removeAgentConfig(
  agent: AgentId,
  location: InstallLocation,
  dryRun: boolean,
  cwd: string,
): string | null {
  const file = agentConfigPath(agent, location, cwd)
  let removed: boolean
  switch (agent) {
    case 'codex':
      removed = removeCodexToml(file, dryRun)
      break
    case 'opencode':
      removed = removeOpencodeConfig(file, dryRun)
      break
    case 'hermes':
      removed = removeHermesYaml(file, dryRun)
      break
    default:
      removed = removeMcpJson(file, dryRun)
  }
  return removed ? file : null
}

export interface UninstallAgentsOptions {
  target?: string
  location?: InstallLocation
  yes?: boolean
  /** Project root for local configs (defaults to process.cwd()). */
  cwd?: string
}

export interface UninstallAgentsResult {
  targets: AgentId[]
  location: InstallLocation
  dryRun: boolean
  removed: string[]
  absent: string[]
}

/** Reverse of installAgents — strip the hubdocs MCP entry from targeted agent configs. */
export function uninstallAgents(opts: UninstallAgentsOptions = {}): UninstallAgentsResult {
  const dryRun = !opts.yes
  const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd()
  const detected = detectAgents(cwd)
  const location: InstallLocation = opts.location ?? 'local'
  const targets = parseTargets(opts.target ?? 'auto', detected)
  const removed: string[] = []
  const absent: string[] = []

  for (const agent of targets) {
    if (!supportsLocation(agent, location)) {
      absent.push(`${agent}: no ${location} config`)
      continue
    }
    const file = removeAgentConfig(agent, location, dryRun, cwd)
    if (file) {
      removed.push(`${agent}: ${file}`)
      if (agent === 'claude') {
        const perm = removeClaudePermissions(location, dryRun, cwd)
        if (perm) removed.push(`claude: ${perm} (permissions)`)
      }
    } else {
      absent.push(`${agent}: no ${MCP_NAME} entry`)
    }
  }

  return { targets, location, dryRun, removed, absent }
}

async function promptInteractive(detected: AgentId[]): Promise<{
  targets: AgentId[]
  location: InstallLocation
}> {
  console.log('hubdocs init — wire MCP into agents\n')
  const pre = detected.length > 0 ? detected : (['cursor'] as AgentId[])

  const targets = await checkboxPrompt<AgentId>({
    message: 'Which agents should get hubdocs MCP?',
    choices: AGENT_IDS.map((id) => ({
      value: id,
      name: detected.includes(id)
        ? `${AGENT_LABEL[id]}  (detected)`
        : AGENT_LABEL[id],
      checked: pre.includes(id),
    })),
  })

  const location = await selectPrompt<InstallLocation>({
    message: 'Install location?',
    defaultIndex: 0,
    choices: [
      {
        value: 'local',
        name: 'local — project configs only (codex/hermes/antigravity need global)',
      },
      {
        value: 'global',
        name: 'global — home configs for all projects',
      },
    ],
  })

  return { targets, location }
}

export async function installAgents(opts: InstallOptions = {}): Promise<InstallResult> {
  if (opts.printConfig) {
    const key = opts.printConfig.toLowerCase()
    const id = AGENT_ALIASES[key]
    if (!id) {
      throw new Error(
        `Unknown agent "${opts.printConfig}". Known: ${AGENT_IDS.join(', ')}, agy`,
      )
    }
    const location = opts.location ?? 'local'
    process.stdout.write(formatPrintConfig(id, location, opts.docsRoot))
    return { targets: [id], location, written: [], skipped: [] }
  }

  const detected = detectAgents()
  let location: InstallLocation = opts.location ?? 'local'
  let targets: AgentId[]

  if (opts.mcpFile) {
    const location = opts.location ?? 'local'
    const entry = buildMcpEntry({
      useWsl: opts.useWsl,
      docsRoot: opts.docsRoot,
      location,
    })
    const written = mergeMcpJson(opts.mcpFile, entry)
    return {
      targets: ['cursor'],
      location,
      written: [{ agent: 'cursor', path: written }],
      skipped: [],
    }
  }

  if (opts.yes || opts.target) {
    targets = parseTargets(opts.target ?? 'auto', detected)
    location = opts.location ?? 'local'
  } else if (!process.stdin.isTTY) {
    targets = parseTargets('auto', detected)
    location = opts.location ?? 'local'
  } else {
    const picked = await promptInteractive(detected)
    targets = picked.targets
    location = opts.location ?? picked.location
  }

  const baseEntry = buildMcpEntry({
    useWsl: opts.useWsl,
    docsRoot: opts.docsRoot,
    location,
  })
  const written: InstallResult['written'] = []
  const skipped: string[] = []

  for (const agent of targets) {
    if (!supportsLocation(agent, location)) {
      skipped.push(
        `${agent}: no project-local config — re-run with --location=global`,
      )
      continue
    }
    written.push({ agent, path: writeAgentConfig(agent, location, baseEntry) })
    if (agent === 'claude') {
      const perm = mergeClaudePermissions(location)
      if (perm) written.push({ agent: 'claude', path: `${perm} (permissions)` })
    }
  }

  if (!targets.length) skipped.push('no targets selected')

  return { targets, location, written, skipped }
}
