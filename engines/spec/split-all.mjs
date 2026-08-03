#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { parse } from 'yaml'
import { splitBundleFile, checkSplitBundle } from './lib/bundle-ir.mjs'

const ROOT = path.resolve(process.argv.includes('--root')
  ? process.argv[process.argv.indexOf('--root') + 1]
  : 'product')

async function globBundles(dir) {
  const files = []
  let entries = []
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await globBundles(entryPath)))
    else if (entry.isFile() && entry.name.endsWith('.bundle.yaml')) files.push(entryPath)
  }
  return files.sort()
}

async function globBackendSpecs(dir) {
  const files = []
  let entries = []
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await globBackendSpecs(entryPath)))
    else if (entry.isFile() && (entry.name === '01-backend-spec.yaml' || entry.name === '02-openapi.yaml')) files.push(entryPath)
  }
  return files.sort()
}

async function main() {
  const bundles = await globBundles(ROOT)
  const beSpecs = await globBackendSpecs(ROOT)
  
  if (!bundles.length && !beSpecs.length) {
    console.log(`spec:split:all: no *.bundle.yaml or backend specs found under ${path.relative(process.cwd(), ROOT) || ROOT}`)
    return
  }

  let failed = 0
  for (const bundlePath of bundles) {
    const rel = path.relative(process.cwd(), bundlePath)
    try {
      await splitBundleFile(bundlePath)
      const { ok, mismatches } = await checkSplitBundle(bundlePath)
      if (ok) console.log(`✔ spec:split:all ${rel}`)
      else {
        failed++
        console.error(`✖ spec:split:all ${rel}: ${mismatches.join('; ')}`)
      }
    } catch (error) {
      failed++
      console.error(`✖ spec:split:all ${rel}: ${error.message ?? error}`)
    }
  }

  for (const beSpecPath of beSpecs) {
    const rel = path.relative(process.cwd(), beSpecPath)
    try {
      // Validate YAML syntax readability
      const content = await readFile(beSpecPath, 'utf8')
      parse(content)
      console.log(`✔ spec:split:all [BE] ${rel}`)
    } catch (error) {
      failed++
      console.error(`✖ spec:split:all [BE] ${rel}: ${error.message ?? error}`)
    }
  }

  const total = bundles.length + beSpecs.length
  console.log(`\nspec:split:all: ${total - failed}/${total} file(s) (UI Bundles + BE Specs) verified`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
