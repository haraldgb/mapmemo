let googleMapsApiKeyPromise: Promise<string> | null = null

type ApiKeyResponse = {
  apiKey: string
}

export const fetchGoogleMapsApiKey = async () => {
  if (googleMapsApiKeyPromise) {
    return googleMapsApiKeyPromise
  }

  googleMapsApiKeyPromise = (async () => {
    const response = await fetch('/api/google-maps-key', {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) {
      throw new Error('Failed to fetch Google Maps API key')
    }
    const data = (await response.json()) as ApiKeyResponse
    if (!data.apiKey) {
      throw new Error('Google Maps API key is missing')
    }
    return data.apiKey
  })()

  return googleMapsApiKeyPromise
}
