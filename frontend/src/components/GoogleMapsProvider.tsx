import { APIProvider } from '@vis.gl/react-google-maps'
import { useEffect, useState, type ReactNode } from 'react'
import { fetchGoogleMapsApiKey } from '../utils/googleMapsApiKey'
import { Spinner } from './Spinner'

type GoogleMapsProviderProps = {
  children: ReactNode
}

export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(function fetchAPIKey() {
    let isMounted = true
    fetch('/api/health', { method: 'GET', credentials: 'include' }).then(() => {
      fetchGoogleMapsApiKey()
        .then((key) => {
          if (isMounted) {
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
    })
  }, [])

  if (!apiKey) {
    return (
      <div className={s_loading}>
        <Spinner />
        Loading map...
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

const s_loading =
  'flex min-h-screen flex-col items-center justify-center gap-3 text-sm font-medium text-slate-600'
