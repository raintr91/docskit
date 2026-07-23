import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { resolveDevAppBaseUrl } from './lib/load-dev-base-url.mjs'
import { MD_NONE } from './lib/markdown-table.mjs'
import { renderSpecMarkdown } from './lib/render-spec-markdown.mjs'
import {
  bundleMarkdownOutputPath,
  bundleSlug,
  renderBundleMarkdown
} from './lib/render-bundle-markdown.mjs'

const projectRoot = process.cwd()
const docsDir = path.resolve('docs')
const featuresDir = path.join(docsDir, 'features')

function cliFlag(name) {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
function cliBool(name) {
  return process.argv.includes(`--${name}`)
}

const hasSurfaces = fs.existsSync(path.resolve('product/surfaces'))
const defaultYamlRoot = hasSurfaces ? path.resolve('product/surfaces') : path.join(featuresDir, 'yaml')
const defaultMdRoot = hasSurfaces ? path.resolve('product/surfaces') : path.join(featuresDir, 'md')
const defaultLegacyRoot = hasSurfaces ? path.resolve('product/surfaces') : featuresDir

const yamlRoot = cliFlag('yaml-root') ? path.resolve(cliFlag('yaml-root')) : defaultYamlRoot
const mdRoot = cliFlag('md-root') ? path.resolve(cliFlag('md-root')) : defaultMdRoot
const legacyRoot = cliFlag('legacy-root') ? path.resolve(cliFlag('legacy-root')) : defaultLegacyRoot
const writeIndex = !cliBool('no-index')
const devAppBaseUrl = resolveDevAppBaseUrl(projectRoot)

async function main() {
  const started = Date.now()
  const specs = await listSpecFiles(legacyRoot)
  const bundles = await listBundleFiles(yamlRoot)

  let failed = 0

  for (const specFile of specs) {
    try {
      await renderLegacySpec(specFile)
    } catch (error) {
      failed++
      console.error(`docs:render: FAIL ${path.relative(projectRoot, specFile)}: ${error.message ?? error}`)
    }
  }

  const bundleMdLinks = []
  for (const bundleFile of bundles) {
    try {
      await renderBundleFeature(bundleFile)
      const mdPath = bundleMarkdownOutputPath(bundleFile, docsDir, yamlRoot, mdRoot)
      const rel = path.relative(docsDir, mdPath).split(path.sep).join('/')
      const bundle = await readYaml(bundleFile)
      bundleMdLinks.push(`- [${bundle.title ?? bundleSlug(bundleFile)}](/${rel.replace(/\.md$/, '')})`)
    } catch (error) {
      failed++
      console.error(`docs:render: FAIL ${path.relative(projectRoot, bundleFile)}: ${error.message ?? error}`)
    }
  }

  if (failed > 0) {
    console.error(`docs:render: aborted index — ${failed} file(s) failed`)
    process.exit(1)
  }

  if (writeIndex) await renderFeatureIndex(specs, bundleMdLinks)

  const elapsed = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `docs:render: ${specs.length} legacy spec(s), ${bundles.length} bundle(s) [${elapsed}s] (testcase MD → tests hub cases:render)`
  )
}

async function renderLegacySpec(specFile) {
  const featureDir = path.dirname(specFile)
  const slug = featureSlug(specFile)
  const output = featureOutputPaths(specFile, slug)
  const spec = await readYaml(specFile)
  const generatedDir = path.join(featureDir, 'generated')
  const generatedTestcasesDir = path.join(generatedDir, output.testcasesDir)

  await rm(path.join(generatedDir, output.specFile), { force: true })
  await rm(path.join(generatedDir, `${slug}.spec.md`), { force: true })
  await rm(path.join(generatedDir, `${slug}.README.md`), { force: true })
  // R3: do not emit testcase MD here — use base-tests `pnpm cases:render`
  await rm(generatedTestcasesDir, { recursive: true, force: true })
  await mkdir(generatedDir, { recursive: true })

  await writeFile(
    path.join(generatedDir, output.specFile),
    renderSpecMarkdown(spec, { testcases: [], output, devAppBaseUrl, projectRoot }),
    'utf8'
  )
}

async function renderBundleFeature(bundleFile) {
  const bundle = await readYaml(bundleFile)
  const mdOut = bundleMarkdownOutputPath(bundleFile, docsDir, yamlRoot, mdRoot)
  const mdDir = path.dirname(mdOut)
  const mdTestcasesDir = path.join(mdDir, 'testcases')
  // Drop stale co-located testcase MD under design render trees
  await rm(mdTestcasesDir, { recursive: true, force: true })

  const output = { specFile: path.basename(mdOut), testcasesDir: 'testcases' }
  await mkdir(mdDir, { recursive: true })
  await writeFile(
    mdOut,
    renderBundleMarkdown(bundle, { testcases: [], output, devAppBaseUrl, projectRoot }),
    'utf8'
  )
}

async function renderFeatureIndex(specs, bundleMdLinks = []) {
  const rows = []

  for (const specFile of specs) {
    const spec = await readYaml(specFile)
    const output = featureOutputPaths(specFile, featureSlug(specFile))
    rows.push(`- [${spec.title ?? featureSlug(specFile)}](${vitepressDocLink(specFile, output)})`)
  }

  rows.push(...bundleMdLinks)

  await writeFile(
    path.join(docsDir, 'common-ui', 'generated.md'),
    `# Tài liệu tính năng đã render\n\n${rows.join('\n') || MD_NONE}\n`,
    'utf8'
  )
}

async function readYaml(file) {
  return parse(await readFile(file, 'utf8')) ?? {}
}

async function listSpecFiles(dir) {
  const files = []

  for (const entry of await listEntries(dir)) {
    const entryPath = path.join(dir, entry.name)

    if (entry.name === 'yaml' || entry.name === 'md') continue

    if (entry.isDirectory()) {
      files.push(...await listSpecFiles(entryPath))
      continue
    }

    if (entry.isFile() && (entry.name === 'spec.yaml' || entry.name === 'spec.yml' || /\.spec\.ya?ml$/.test(entry.name))) {
      files.push(entryPath)
    }
  }

  return files.sort()
}

async function listBundleFiles(dir) {
  const files = []

  for (const entry of await listEntries(dir)) {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...await listBundleFiles(entryPath))
      continue
    }

    if (entry.isFile() && /\.bundle\.ya?ml$/.test(entry.name)) {
      files.push(entryPath)
    }
  }

  return files.sort()
}

function vitepressDocLink(specFile, output) {
  const relativeDir = path.relative(docsDir, path.dirname(specFile)).split(path.sep).join('/')
  const pagePath = output.specFile.replace(/\.md$/, '')
  return `/${relativeDir}/generated/${pagePath}`
}

function featureSlug(specFile) {
  const basename = path.basename(specFile)
  if (basename === 'spec.yaml' || basename === 'spec.yml') return path.basename(path.dirname(specFile))
  return basename.replace(/\.spec\.ya?ml$/, '')
}

function featureOutputPaths(specFile, slug) {
  const basename = path.basename(specFile)
  if (basename === 'spec.yaml' || basename === 'spec.yml') {
    return {
      specFile: 'spec.md',
      testcasesDir: 'testcases'
    }
  }

  return {
    specFile: `${slug}.md`,
    testcasesDir: `${slug}/testcases`
  }
}

async function listEntries(dir) {
  try {
    return await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
