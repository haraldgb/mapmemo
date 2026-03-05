import { execSync } from 'child_process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
