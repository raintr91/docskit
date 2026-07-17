export { createServer, main } from './mcp/server.js'
export { resolveDocsRoot, packageRoot, defaultHubdocsRoot } from './config/docs-root.js'
export {
  indexIds,
  kindOf,
  isRedirectStub,
  expectedCanonicalPath,
  CANONICAL_DIR,
  SCAN_MD_DIRS,
} from './scan/ids.js'
export { routeTopic } from './scan/route.js'
export {
  installHarness,
  statusHarness,
  pruneHarness,
  INSTALL_MANIFEST_PATH,
  INSTALL_MANIFEST_SCHEMA,
  HUBDOCS_OWNED_SKILLS,
} from './install/harness.js'
export type {
  HarnessInstallManifest,
  HarnessInstallResult,
  HarnessStatusResult,
  HarnessPruneResult,
  StaleHarnessAsset,
} from './install/harness.js'
