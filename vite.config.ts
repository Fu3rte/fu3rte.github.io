import { fileURLToPath } from 'node:url'
import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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

// 新增案例要同时在这里登记：GitHub Pages 只认静态路径，少一条就少一份目录索引
const CASE_PATHS = [
  'projects/fit-agent',
  'projects/calisthenics-log',
]

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
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-gsap': ['gsap'],
          'vendor-radix': ['radix-ui'],
          'vendor-i18n': ['i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
})
