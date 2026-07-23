import { withMermaid } from 'vitepress-plugin-mermaid'
import { defineConfig } from 'vitepress'

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
        { text: 'Overview', link: '/architecture/03-context/' },
        { text: 'Modules', link: '/product/components/' },
        { text: 'Flows', link: '/architecture/06-runtime/' },
        { text: 'Platform', link: '/platform/guide/' },
      ],
      // Business-first nav; arc42 chapters stay as git SSOT (thin for team)
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
          text: 'System',
          collapsed: false,
          items: [
            { text: 'Overview (context)', link: '/architecture/03-context/' },
            { text: 'Runtime containers', link: '/architecture/05-building-blocks/' },
            {
              text: 'Modules',
              collapsed: true,
              items: [
                { text: 'All CMP', link: '/product/components/' },
                { text: 'Auth (CMP-01)', link: '/product/components/CMP-01-auth/' },
              ],
            },
            {
              text: 'Business processes',
              collapsed: true,
              items: [
                { text: 'Catalog', link: '/architecture/06-runtime/' },
                { text: 'FLOW-login', link: '/architecture/06-runtime/journeys/FLOW-login' },
              ],
            },
            { text: 'Deploy', link: '/architecture/07-deployment/' },
            {
              text: 'Common / shared',
              collapsed: true,
              items: [
                { text: 'Common', link: '/product/common/' },
                { text: 'API catalog', link: '/product/shared/api-catalog/' },
                { text: 'Data model', link: '/product/shared/data-model/' },
                { text: 'Integrations', link: '/product/shared/integrations/' },
              ],
            },
          ],
        },
        {
          text: 'Architecture (lead)',
          collapsed: true,
          items: [
            { text: '01 Introduction', link: '/architecture/01-introduction/' },
            { text: '02 Constraints', link: '/architecture/02-constraints/' },
            { text: '04 Strategy', link: '/architecture/04-solution-strategy/' },
            {
              text: '08 Cross-cutting',
              collapsed: true,
              items: [
                { text: 'Index', link: '/architecture/08-cross-cutting/' },
                { text: 'Security', link: '/architecture/08-cross-cutting/security' },
                { text: 'Observability', link: '/architecture/08-cross-cutting/observability' },
                { text: 'Configuration', link: '/architecture/08-cross-cutting/configuration' },
              ],
            },
            { text: '09 Decisions', link: '/architecture/09-decisions/' },
            {
              text: '10–12',
              collapsed: true,
              items: [
                { text: '10 Quality', link: '/architecture/10-quality/' },
                { text: '11 Risks', link: '/architecture/11-risks/' },
                { text: '12 Glossary', link: '/architecture/12-glossary/' },
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
