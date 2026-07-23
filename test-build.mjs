import { execSync } from 'child_process'
try {
  execSync('npx docskit docs build', { cwd: '/home/vutv/workspace/base-docs', stdio: 'inherit' })
} catch (e) {
  process.exit(1)
}
