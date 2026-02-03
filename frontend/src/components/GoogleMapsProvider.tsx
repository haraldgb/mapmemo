import { APIProvider } from '@vis.gl/react-google-maps'
import { useEffect, useState, type ReactNode } from 'react'
import { fetchGoogleMapsApiKey } from '../utils/googleMapsApiKey'
import { Spinner } from './Spinner'
import { useLocation } from 'react-router-dom'
import { pathUsesMaps } from '../utils/allowedPaths'

type GoogleMapsProviderProps = {
  children: ReactNode
}

export const GoogleMapsProvider = ({ children }: GoogleMapsProviderProps) => {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const location = useLocation()

  useEffect(function fetchAPIKey() {
    let isMounted = true
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
  }, [])

  if (!apiKey) {
    if (pathUsesMaps(location.pathname)) {
      return (
        <div className={s_loading}>
          <Spinner />
          Loading map...
        </div>
      )
    }
    return <>{children}</>
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
