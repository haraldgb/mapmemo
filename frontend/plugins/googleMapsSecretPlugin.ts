import type { Plugin } from 'vite'
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

export const googleMapsSecretPlugin = (
  googleMapsSecretName: string | undefined,
): Plugin => {
  const client = new SecretManagerServiceClient()
  let cachedKeyPromise: Promise<string> | null = null

  const loadApiKey = async () => {
    if (cachedKeyPromise) {
      return cachedKeyPromise
    }
    if (!googleMapsSecretName) {
      throw new Error('GOOGLE_MAPS_API_KEY_SECRET is not set')
    }
    cachedKeyPromise = client
      .accessSecretVersion({ name: googleMapsSecretName })
      .then(([version]) => {
        const payload = version.payload?.data?.toString()
        if (!payload) {
          throw new Error('Google Maps API key secret payload is empty')
        }
        return payload
      })
    return cachedKeyPromise
  }

  type ApiResponse = {
    statusCode: number
    setHeader: (name: string, value: string) => void
    end: (data?: string) => void
  }

  const handleRequest = async (req: { method?: string }, res: ApiResponse) => {
    if (req.method && req.method !== 'GET') {
      res.statusCode = 405
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Method not allowed' }))
      return
    }

    try {
      const apiKey = await loadApiKey()
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ apiKey }))
    } catch (error) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Failed to load API key',
        }),
      )
    }
  }

  return {
    name: 'google-maps-secret',
    configureServer(server) {
      server.middlewares.use('/api/google-maps-key', (req, res) => {
        void handleRequest(req, res)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/google-maps-key', (req, res) => {
        void handleRequest(req, res)
      })
    },
  }
}
