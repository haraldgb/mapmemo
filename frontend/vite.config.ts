import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { googleMapsSecretPlugin } from './plugins/googleMapsSecretPlugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const googleMapsSecretName = env.GOOGLE_MAPS_API_KEY_SECRET

  return {
    plugins: [
      tailwindcss(),
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      googleMapsSecretPlugin(googleMapsSecretName),
    ],
  }
})
