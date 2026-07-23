import { resolveConfig } from 'vitepress'
import path from 'node:path'

async function check() {
  try {
    const config = await resolveConfig(process.cwd(), 'serve', 'development', undefined, undefined, true)
    console.log(config.site.themeConfig.sidebar ? 'Sidebar exists' : 'Sidebar MISSING')
  } catch (e) {
    console.error('Error loading config:', e)
  }
}
check()
