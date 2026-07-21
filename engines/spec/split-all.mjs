#!/usr/bin/env node
import { readdir } from 'node:fs/promises'
import path from 'node:path'
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

async function main() {
  const bundles = await globBundles(ROOT)
  if (!bundles.length) {
    console.log(`spec:split:all: no *.bundle.yaml found under ${path.relative(process.cwd(), ROOT) || ROOT}`)
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

  console.log(`\nspec:split:all: ${bundles.length - failed}/${bundles.length} bundle(s) split + verified`)
  process.exit(failed > 0 ? 1 : 0)
}

main()
