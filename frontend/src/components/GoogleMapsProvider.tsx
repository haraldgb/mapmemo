import { APIProvider } from '@vis.gl/react-google-maps'
import { useEffect, useState, type ReactNode } from 'react'
import { fetchGoogleMapsApiKey } from '../utils/googleMapsApiKey'
import { Spinner } from './Spinner'

// Module-level cache so remounts (e.g. navigating away and back to /game)
// don't show the spinner or re-fire the health-check fetch.
let resolvedApiKey: string | null = null

type GoogleMapsProviderProps = {
  children: ReactNode
}

export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [apiKey, setApiKey] = useState<string | null>(resolvedApiKey)

  useEffect(
    function fetchAPIKey() {
      if (apiKey) {
        return
      }
      let isMounted = true
      fetch('/api/health', { method: 'GET', credentials: 'include' }).then(
        () => {
          fetchGoogleMapsApiKey()
            .then((key) => {
              if (isMounted) {
                resolvedApiKey = key
                setApiKey(key)
              }
            })
            .catch((err: unknown) => {
              if (!isMounted) {
                return
              }
              if (err instanceof Error) {
                throw err
              } else {
                throw new Error('Failed to load Google Maps API key')
              }
            })
          return () => {
            isMounted = false
          }
        },
      )
    },
    [apiKey],
  )

  if (!apiKey) {
    return (
      <div className={s_loading}>
        <Spinner />
      </div>
    )
  }

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={['places', 'marker']}
      version='weekly'
    >
      {children}
    </APIProvider>
  )
}

const s_loading = 'flex flex-1 items-center justify-center'
