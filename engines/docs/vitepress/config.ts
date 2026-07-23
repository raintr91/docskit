import { withMermaid } from 'vitepress-plugin-mermaid'
import { defineConfig } from 'vitepress'
import fs from 'node:fs'
import path from 'node:path'

const projectRoot = process.cwd()
const hasProductArchitecture = fs.existsSync(path.join(projectRoot, 'product', 'architecture'))
const archPrefix = hasProductArchitecture ? '/product/architecture' : '/architecture'

function buildRecursiveSidebar(dirPath: string, urlPrefix: string): any[] {
  if (!fs.existsSync(dirPath)) return []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const items: any[] = []

    // Read files first (excluding index.md)
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md') {
        const filePath = path.join(dirPath, entry.name)
        const nameWithoutExt = entry.name.replace(/\.md$/, '')
        let title = nameWithoutExt.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          const titleMatch = content.match(/^#\s+(.+)$/m)
          if (titleMatch) title = titleMatch[1].trim()
        } catch {}
        items.push({
          text: title,
          link: `${urlPrefix}${nameWithoutExt}`
        })
      }
    }

    // Read directories
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (['code', 'ir', 'yaml', 'node_modules', '.git'].includes(entry.name)) continue
        const subDirPath = path.join(dirPath, entry.name)
        const indexPath = path.join(subDirPath, 'index.md')
        let title = entry.name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        let link = undefined

        if (fs.existsSync(indexPath)) {
          try {
            const content = fs.readFileSync(indexPath, 'utf8')
            const titleMatch = content.match(/^#\s+(.+)$/m)
            if (titleMatch) title = titleMatch[1].trim()
          } catch {}
          link = `${urlPrefix}${entry.name}/`
        }

        const subItems = buildRecursiveSidebar(subDirPath, `${urlPrefix}${entry.name}/`)
        const item: any = { text: title }
        if (link) item.link = link
        if (subItems.length > 0) {
          item.items = subItems
          item.collapsed = true
        }
        
        if (link || subItems.length > 0) {
          items.push(item)
        }
      }
    }

    return items
  } catch (e) {
    return []
  }
}

function getSurfacesSidebar(root: string) {
  const surfacesDir = path.join(root, 'product', 'surfaces')
  return buildRecursiveSidebar(surfacesDir, '/product/surfaces/')
}

function getOverviewSidebar(root: string) {
  const overviewDir = path.join(root, 'product', 'overview')
  return buildRecursiveSidebar(overviewDir, '/product/overview/')
}

function getJourneysSidebarItems(root: string, prefix: string) {
  const journeysDir = path.join(root, prefix.replace(/^\//, ''), '06-runtime', 'journeys')
  if (!fs.existsSync(journeysDir)) return []
  try {
    const entries = fs.readdirSync(journeysDir, { withFileTypes: true })
    const items = []
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const nameWithoutExt = entry.name.replace(/\.md$/, '')
        if (nameWithoutExt === 'index') continue
        let title = nameWithoutExt
        const content = fs.readFileSync(path.join(journeysDir, entry.name), 'utf8')
        const titleMatch = content.match(/^#\s+(.+)$/m)
        if (titleMatch) {
          title = titleMatch[1].trim()
        }
        items.push({
          text: title,
          link: `${prefix}/06-runtime/journeys/${nameWithoutExt}`
        })
      }
    }
    return items.sort((a, b) => a.text.localeCompare(b.text))
  } catch (e) {
    return []
  }
}

function getCrossCuttingSidebarItems(root: string, prefix: string) {
  const crossDir = path.join(root, prefix.replace(/^\//, ''), '08-cross-cutting')
  if (!fs.existsSync(crossDir)) return []
  try {
    const entries = fs.readdirSync(crossDir, { withFileTypes: true })
    const items = []
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const nameWithoutExt = entry.name.replace(/\.md$/, '')
        if (nameWithoutExt === 'index') continue
        let title = nameWithoutExt
        const content = fs.readFileSync(path.join(crossDir, entry.name), 'utf8')
        const titleMatch = content.match(/^#\s+(.+)$/m)
        if (titleMatch) {
          title = titleMatch[1].trim()
        }
        items.push({
          text: title,
          link: `${prefix}/08-cross-cutting/${nameWithoutExt}`
        })
      }
    }
    return items.sort((a, b) => a.text.localeCompare(b.text))
  } catch (e) {
    return []
  }
}

export default withMermaid(
  defineConfig({
    title: 'Base Docs',
    description: 'Platform docs hub — arc42 + C4 views + product Code/common (R2)',
    cleanUrls: true,
    ignoreDeadLinks: true,
    srcExclude: [
      '**/node_modules/**',
      '**/scripts/**',
      '**/registries/**',
      '**/.cursor/**',
      '**/package.json',
      '**/platform-repos*.json',
      '**/legacy-repos*.json',
      '**/product/**/code/**/*.yaml',
      '**/product/**/code/**/ir/**',
    ],
    // Node sizes are computed from this font size — keep in sync with the CSS pin in theme/custom.css
    mermaid: {
      themeVariables: {
        fontSize: '18px',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        padding: 16,
        nodeSpacing: 50,
        rankSpacing: 60,
      },
      sequence: {
        useMaxWidth: true,
        diagramMarginX: 40,
        diagramMarginY: 20,
        actorMargin: 50,
        boxMargin: 12,
      },
    },
    vite: {
      resolve: {
        dedupe: ['vue', 'vitepress', 'vitepress-plugin-mermaid', 'vitepress-mermaid-renderer'],
      },
      // vitepress-plugin-mermaid forces these into optimizeDeps; pnpm needs them as direct deps
      // (see .npmrc public-hoist-pattern). Do NOT alias dayjs → 'dayjs/' (breaks absolute resolve).
      optimizeDeps: {
        include: [
          'mermaid',
          'dayjs',
          'debug',
          'cytoscape',
          'cytoscape-cose-bilkent',
          '@braintree/sanitize-url',
        ],
      },
    },
    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        { text: 'Start now', link: '/platform/guide/start-now' },
        { text: 'Overview', link: '/product/overview/' },
        { text: 'Surfaces', link: '/product/surfaces/' },
        { text: 'Platform', link: '/platform/guide/' },
      ],
      sidebar: [
        {
          text: 'Start',
          collapsed: false,
          items: [
            { text: 'Start now', link: '/platform/guide/start-now' },
            { text: 'Doc structure', link: '/platform/guide/SYSTEM-DOC-STRUCTURE' },
          ],
        },
        {
          text: 'Overview',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/product/overview/' },
            ...getOverviewSidebar(projectRoot)
          ]
        },
        {
          text: 'Surfaces',
          collapsed: false,
          items: getSurfacesSidebar(projectRoot),
        },
        {
          text: 'Architecture',
          collapsed: false,
          items: [
            { text: 'System Context', link: `${archPrefix}/03-context/` },
            { text: 'Runtime Containers', link: `${archPrefix}/05-building-blocks/` },
            {
              text: 'Runtime Journeys',
              collapsed: true,
              items: [
                { text: 'Catalog', link: `${archPrefix}/06-runtime/` },
                ...getJourneysSidebarItems(projectRoot, archPrefix),
              ],
            },
            { text: 'Deployment', link: `${archPrefix}/07-deployment/` },
            { text: 'Architecture Trace', link: '/ARCHITECTURE-TRACE' },
          ],
        },
        {
          text: 'Architecture (lead)',
          collapsed: true,
          items: [
            { text: '01 Introduction', link: `${archPrefix}/01-introduction/` },
            { text: '02 Constraints', link: `${archPrefix}/02-constraints/` },
            { text: '04 Solution Strategy', link: `${archPrefix}/04-solution-strategy/` },
            {
              text: '08 Cross-cutting',
              collapsed: true,
              items: [
                { text: 'Index', link: `${archPrefix}/08-cross-cutting/` },
                ...getCrossCuttingSidebarItems(projectRoot, archPrefix),
              ],
            },
            { text: '09 Decisions', link: `${archPrefix}/09-decisions/` },
            {
              text: '10–12',
              collapsed: true,
              items: [
                { text: '10 Quality', link: `${archPrefix}/10-quality/` },
                { text: '11 Risks', link: `${archPrefix}/11-risks/` },
                { text: '12 Glossary', link: `${archPrefix}/12-glossary/` },
              ],
            },
            { text: 'Legacy dynamics', link: '/product/legacy-dynamics/' },
          ],
        },
        {
          text: 'Platform',
          collapsed: true,
          items: [
            {
              text: 'Guide',
              collapsed: true,
              items: [
                { text: 'Index', link: '/platform/guide/' },
                { text: 'Overview', link: '/platform/guide/platform-base-overview' },
                { text: 'Toolkits (MCP)', link: '/platform/guide/toolkits' },
                { text: 'Team AI workflow', link: '/platform/guide/team-ai-workflow-slides' },
                { text: 'YAML ↔ MD workflow', link: '/platform/guide/yaml-markdown-ai-workflow' },
                { text: 'E2E Playwright', link: '/platform/guide/e2e-automation-playwright' },
              ],
            },
            {
              text: 'Toolchain',
              collapsed: true,
              items: [
                { text: 'Index', link: '/platform/toolchain/' },
                { text: 'Toolkits (MCP)', link: '/platform/guide/toolkits' },
                { text: 'Full cycle', link: '/platform/toolchain/FULL-CYCLE-PIPELINE-DIAGRAM' },
                { text: 'Design phase', link: '/platform/toolchain/DESIGN-PHASE-DIAGRAM' },
                { text: 'Repo split map', link: '/platform/toolchain/REPO-SPLIT-MAP' },
              ],
            },
            {
              text: 'Bases',
              collapsed: true,
              items: [
                {
                  text: 'Portal git',
                  link: 'https://github.com/raintr91/nuxt_4/blob/nuxt_v_3/docs/operational/PORTAL-CODEGEN.md',
                },
                {
                  text: 'FastAPI git',
                  link: 'https://github.com/raintr91/fast-api/blob/v3/docs/operational/FAST-API-QUICKSTART.md',
                },
                {
                  text: 'Laravel API git',
                  link: 'https://github.com/raintr91/lara12/blob/v3/docs/operational/BACKEND-API-QUICKSTART.md',
                },
                { text: 'Nest BE', link: 'https://github.com/raintr91/next_nest/blob/next_nest_v3/docs/operational/NEST-API-STRUCTURE.md' },
                { text: 'Integration (git)', link: 'https://github.com/raintr91/integration' },
                { text: 'Line client (git)', link: 'https://github.com/raintr91/winform' },
              ],
            },
          ],
        },
      ],
    },
  }),
)
