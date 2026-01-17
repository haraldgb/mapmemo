let googleMapsScriptPromise: Promise<void> | null = null

export const loadGoogleMapsScript = (apiKey: string) => {
  const hasGoogleMaps = Boolean((window as Window & { google?: typeof google }).google?.maps?.Map)
  if (hasGoogleMaps) {
    return Promise.resolve()
  }
  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise
  }

  const existingScript = document.querySelector('script[data-google-maps="true"]')
  if (existingScript) {
    googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
      if ((window as Window & { google?: typeof google }).google?.maps?.Map) {
        resolve()
        return
      }
      const onLoad = () => resolve()
      const onError = () => reject(new Error('Failed to load Google Maps script'))
      existingScript.addEventListener('load', onLoad, { once: true })
      existingScript.addEventListener('error', onError, { once: true })
    })
  }

  googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
    const callbackName = '__mapMemoInit'
    ;(window as unknown as Record<string, unknown>)[callbackName] = () => {
      resolve()
    }
    const script = document.createElement('script')
    const scriptSrc = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places&loading=async&callback=${callbackName}`
    script.src = scriptSrc
    script.dataset.googleMaps = 'true'
    script.async = true
    script.defer = true
    script.onload = () => {}
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })
  return googleMapsScriptPromise
}
