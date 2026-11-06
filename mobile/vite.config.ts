import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))
const pwaIcons = [
  'icon-48.webp',
  'icon-72.webp',
  'icon-96.webp',
  'icon-128.webp',
  'icon-192.webp',
  'icon-256.webp',
  'icon-512.webp',
]
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const base =
  process.env.VITE_PAGES_BUILD === 'true' && repositoryName
    ? `/${repositoryName}/`
    : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'copy-pwa-icons',
      generateBundle() {
        for (const icon of pwaIcons) {
          this.emitFile({
            type: 'asset',
            fileName: `icons/${icon}`,
            source: readFileSync(resolve(projectRoot, 'icons', icon)),
          })
        }
      },

      closeBundle() {
        if (process.env.VITE_PAGES_BUILD === 'true') {
          const indexHtmlPath = resolve(projectRoot, 'dist', 'index.html')
          writeFileSync(resolve(projectRoot, 'dist', '404.html'), readFileSync(indexHtmlPath))
        }
      },
    },
  ],
  server: {
    port: 5138,
    host: '0.0.0.0',
    strictPort: true,
  },
})
