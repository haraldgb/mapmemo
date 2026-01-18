import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { googleMapsSecretPlugin } from './plugins/googleMapsSecretPlugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const googleMapsSecretName = env.GOOGLE_MAPS_API_KEY_SECRET

  return {
    plugins: [
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
      googleMapsSecretPlugin(googleMapsSecretName),
    ],
  }
})
