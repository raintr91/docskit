/**
 * Split portal-feature-bundle → ir/{spec,legacy,design}.yaml
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { parse, stringify } from 'yaml'
import {
  BUNDLE_META_KEYS,
  hasGenContent,
  mergeIrSpec,
  partitionIrSpec,
  partitionSpecSection
} from './bundle-schema.mjs'

/**
 * @param {Record<string, unknown>} bundle
 */
export function buildIrFromBundle(bundle) {
  const meta = {}
  for (const key of BUNDLE_META_KEYS) {
    if (bundle[key] != null) meta[key] = bundle[key]
  }
  if (bundle.openQuestions != null) meta.openQuestions = bundle.openQuestions

  const { designSpec, gen } = partitionSpecSection(bundle.spec ?? {}, bundle.gen ?? {})
  const spec = mergeIrSpec(meta, designSpec, gen)
  const legacy = { id: bundle.id, ...(bundle.legacy ?? {}) }
  const design = { id: bundle.id, ...(bundle.design ?? {}) }

  return { spec, legacy, design, designSpec, gen }
}

function restoreComments(sourceYaml, generatedYaml) {
  let result = generatedYaml
  const lines = sourceYaml.split('\n')
  
  for (const line of lines) {
    const match = line.match(/^([^#]+?)\s+#(.+)$/)
    if (!match) continue
    
    const codePart = match[1].trimEnd()
    const commentPart = match[2]
    
    const trimmedCode = codePart.trimStart()
    if (!trimmedCode) continue 
    
    let safeCode = trimmedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    const kvMatch = trimmedCode.match(/^(-\s+)?([a-zA-Z0-9_-]+):\s*(.+)$/)
    if (kvMatch) {
      const prefix = kvMatch[1] || ''
      const key = kvMatch[2]
      let val = kvMatch[3].trim()
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1)
      }
      const safePrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const safeVal = val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      safeCode = `${safePrefix}${safeKey}:\\s*['"]?${safeVal}['"]?`
    }
    
    const replaceRegex = new RegExp(`(^|\\n)(\\s*${safeCode}\\s*)(?!\\s*#)(\\r?\\n|$)`, 'g')
    result = result.replace(replaceRegex, `$1$2#${commentPart}$3`)
  }
  
  return result
}

/**
 * @param {string} bundlePath
 * @param {{ dryRun?: boolean }} [options]
 */
export async function splitBundleFile(bundlePath, options = {}) {
  const absolute = path.resolve(bundlePath)
  const dir = path.dirname(absolute)
  const irDir = path.join(dir, 'ir')
  const rawYaml = await readFile(absolute, 'utf8')
  const bundle = parse(rawYaml) ?? {}

  if (!bundle.id) {
    throw new Error(`Bundle missing id: ${bundlePath}`)
  }

  const { spec, legacy, design } = buildIrFromBundle(bundle)
  const yamlOpts = { lineWidth: 0 }

  if (!options.dryRun) {
    await mkdir(irDir, { recursive: true })
    
    const specYaml = restoreComments(
      rawYaml, 
      stringify(spec, yamlOpts)
    )

    await writeFile(
      path.join(irDir, 'spec.yaml'),
      `# Generated from ${path.basename(bundlePath)} — pnpm spec:split\n${specYaml}`,
      'utf8'
    )
    await writeFile(
      path.join(irDir, 'legacy.yaml'),
      `# Generated from ${path.basename(bundlePath)} — pnpm spec:split\n${stringify(legacy, yamlOpts)}`,
      'utf8'
    )
    await writeFile(
      path.join(irDir, 'design.yaml'),
      `# Generated from ${path.basename(bundlePath)} — pnpm spec:split\n${stringify(design, yamlOpts)}`,
      'utf8'
    )
  }

  return { bundlePath: absolute, irDir, spec, legacy, design }
}

/**
 * @param {string} bundlePath
 */
export async function checkSplitBundle(bundlePath) {
  const absolute = path.resolve(bundlePath)
  const irDir = path.join(path.dirname(absolute), 'ir')
  const rawYaml = await readFile(absolute, 'utf8')
  const bundle = parse(rawYaml) ?? {}
  const expected = buildIrFromBundle(bundle)
  const files = ['spec', 'legacy', 'design']
  const mismatches = []

  for (const name of files) {
    const irPath = path.join(irDir, `${name}.yaml`)
    let actual
    try {
      actual = parse(await readFile(irPath, 'utf8')) ?? {}
    } catch {
      mismatches.push(`${name}.yaml missing`)
      continue
    }
    const expStr = name === 'spec' 
      ? restoreComments(rawYaml, stringify(expected[name], { lineWidth: 0 })).trim()
      : stringify(expected[name], { lineWidth: 0 }).trim()
    
    // We should also strip the first line `# Generated...` if we compare actual string but we parse actual so comments are gone in actual.
    // Wait, the original check uses `stringify(actual)` which will not have comments anyway,
    // so if we add comments to expected[spec], it will mismatch with actual because actual lost comments when parsed!
    // But actual was parsed without comments, so `stringify(actual)` has no comments.
    // If we want check to pass, we should compare without comments. 
    // Let's just compare the plain stringify for check logic, it's safer.
    
    const plainExpStr = stringify(expected[name], { lineWidth: 0 }).trim()
    const actStr = stringify(actual, { lineWidth: 0 }).trim()
    if (plainExpStr !== actStr) mismatches.push(`${name}.yaml out of sync with bundle`)
  }

  return { ok: mismatches.length === 0, mismatches }
}

/**
 * @param {string} bundlePath
 * @param {{ dryRun?: boolean }} [options]
 */
export async function mergeBundleFile(bundlePath, options = {}) {
  const absolute = path.resolve(bundlePath)
  const irDir = path.join(path.dirname(absolute), 'ir')
  const rawYaml = await readFile(absolute, 'utf8')
  const bundle = parse(rawYaml) ?? {}

  const specIr = parse(await readFile(path.join(irDir, 'spec.yaml'), 'utf8')) ?? {}
  const legacyIr = parse(await readFile(path.join(irDir, 'legacy.yaml'), 'utf8')) ?? {}
  const designIr = parse(await readFile(path.join(irDir, 'design.yaml'), 'utf8')) ?? {}

  const { meta, designSpec, gen } = partitionIrSpec(specIr)

  for (const key of BUNDLE_META_KEYS) {
    if (meta[key] != null) bundle[key] = meta[key]
  }
  if (meta.openQuestions != null) bundle.openQuestions = meta.openQuestions

  bundle.spec = designSpec
  if (hasGenContent(gen)) bundle.gen = gen
  else delete bundle.gen

  const legacySection = { ...legacyIr }
  delete legacySection.id
  bundle.legacy = legacySection

  const designSection = { ...designIr }
  delete designSection.id
  bundle.design = designSection

  if (!options.dryRun) {
    const mergedYaml = restoreComments(
      rawYaml, 
      stringify(bundle, { lineWidth: 0 })
    )
    await writeFile(absolute, mergedYaml, 'utf8')
  }

  return { bundlePath: absolute, bundle }
}
