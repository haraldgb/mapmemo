import { execSync } from 'child_process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const appVersion = (() => {
  try {
    return execSync('git describe --tags --always').toString().trim()
  } catch {
    return 'unknown'
  }
})()

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl =
    mode === 'production' ? env.VITE_BACKEND_URL : 'http://localhost:5243'

  return {
    plugins: [
      tailwindcss(),
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      VitePWA({
        manifest: {
          name: 'MapMemo',
          short_name: 'MapMemo',
          description: "Test your knowledge of a city's layout",
          display: 'standalone',
          start_url: '/',
          theme_color: '#f8fafc',
          background_color: '#f8fafc',
          icons: [
            {
              src: '/mapmemo-logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
          screenshots: [
            {
              src: '/screenshots/click-mode-portrait.png',
              sizes: '752x1003',
              type: 'image/png',
              form_factor: 'narrow',
            },
            {
              src: '/screenshots/name-mode-portrait.png',
              sizes: '752x1003',
              type: 'image/png',
              form_factor: 'narrow',
            },
            {
              src: '/screenshots/route-mode-portrait.png',
              sizes: '750x1000',
              type: 'image/png',
              form_factor: 'narrow',
            },
            {
              src: '/screenshots/click-mode.png',
              sizes: '2741x1542',
              type: 'image/png',
              form_factor: 'wide',
            },
            {
              src: '/screenshots/name-mode.png',
              sizes: '2734x1538',
              type: 'image/png',
              form_factor: 'wide',
            },
            {
              src: '/screenshots/route-mode.png',
              sizes: '2748x1546',
              type: 'image/png',
              form_factor: 'wide',
            },
          ],
        },
      }),
    ],
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    server: {
      proxy: {
        '/api': `${backendUrl}`,
      },
    },
  }
})
