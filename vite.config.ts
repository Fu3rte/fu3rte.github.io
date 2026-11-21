import { fileURLToPath } from 'node:url'
import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { PROJECT_IDS } from './src/shared/projects'

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url))

// GitHub Pages 只认静态路径，深链接要有一份目录索引，构建后把同一份 SPA 外壳按路由复制出去
function spaRoutes(routes: string[]): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-routes',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const shell = path.join(outDir, 'index.html')
      for (const route of routes) {
        const dir = path.join(outDir, route)
        mkdirSync(dir, { recursive: true })
        copyFileSync(shell, path.join(dir, 'index.html'))
      }
    },
  }
}

const CASE_PATHS = PROJECT_IDS.map((id) => `projects/${id}`)

export default defineConfig({
  plugins: [react(), tailwindcss(), spaRoutes(['photos', 'contact', ...CASE_PATHS])],
  resolve: {
    alias: {
      '@': here('./src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const norm = id.replace(/\\/g, '/')
          if (!norm.includes('/node_modules/')) return undefined
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(norm)) {
            return 'vendor-react'
          }
          if (/\/node_modules\/gsap\//.test(norm)) {
            return 'vendor-gsap'
          }
          if (/\/node_modules\/(radix-ui|@radix-ui)\//.test(norm)) {
            return 'vendor-radix'
          }
          if (/\/node_modules\/i18next/.test(norm)) {
            return 'vendor-i18n'
          }
          return undefined
        },
      },
    },
  },
})
