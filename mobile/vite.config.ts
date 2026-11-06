import { readFileSync } from 'node:fs'
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

export default defineConfig({
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
    },
  ],
  server: {
    port: 5138,
    host: '0.0.0.0',
    strictPort: true,
  },
})
