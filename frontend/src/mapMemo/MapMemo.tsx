/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react'
import { GOOGLE_MAPS_API_KEY } from '../../../.secrets/secrets'
import { addGeoJsonPolygons } from './utils/polygons'

const OSLO_CENTER = { lat: 59.91, lng: 10.73 }
const MAP_CONTAINER_STYLE: React.CSSProperties = {
  height: '320px',
  width: '720px',
  borderRadius: '12px',
  border: '1px solid #e2e2e2',
}

let googleMapsScriptPromise: Promise<void> | null = null

const loadGoogleMapsScript = (apiKey: string) => {
  const hasGoogleMaps = Boolean((window as Window & { google?: typeof google }).google?.maps?.Map)
  if (hasGoogleMaps) {
    return Promise.resolve()
  }
  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
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

export const MapMemo = () => {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const hasFetchedRef = useRef(false)
  const polygonCleanupRef = useRef<null | (() => void)>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(function initializeMap() {
    let isMounted = true

    const startMap = async () => {
      await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      if (typeof google?.maps?.importLibrary !== 'function') {
        return
      }
      const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary
      if (!isMounted || !mapElementRef.current || mapInstanceRef.current) {
        return
      }

      try {
        mapInstanceRef.current = new Map(mapElementRef.current, {
          mapId: '5da3993597ca412079e99b4c',
          center: OSLO_CENTER,
          zoom: 12,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DEFAULT,
          },
          fullscreenControl: true,
          streetViewControl: true,
        })
      } catch {
        return
      }
      setIsMapReady(true)
    }

    void startMap()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(
    function renderPolygons() {
      if (!isMapReady || !mapInstanceRef.current) {
        return
      }
      const mapInstance = mapInstanceRef.current
      let isActive = true

      const addPolygons = async () => {
        const cleanup = await addGeoJsonPolygons(mapInstance)
        if (!isActive) {
          cleanup?.()
          return
        }
        polygonCleanupRef.current = cleanup ?? null
      }

      void addPolygons()

      return () => {
        isActive = false
        if (polygonCleanupRef.current) {
          polygonCleanupRef.current()
          polygonCleanupRef.current = null
        }
      }
    },
    [isMapReady],
  )

  useEffect(
    function fetchPlacesOnce() {
      if (!isMapReady || !mapInstanceRef.current || hasFetchedRef.current) {
        return
      }
      hasFetchedRef.current = true

      const runTextSearch = async () => {
        const { Place } = (await google.maps.importLibrary('places')) as google.maps.PlacesLibrary
        const { AdvancedMarkerElement } = (await google.maps.importLibrary(
          'marker',
        )) as google.maps.MarkerLibrary
        const locationBias = new google.maps.Circle({ center: OSLO_CENTER, radius: 5000 })
        const { places } = await Place.searchByText({
          textQuery: 'Bydeler i Oslo',
          fields: ['displayName', 'formattedAddress', 'location', 'types'],
          locationBias,
          maxResultCount: 50,
          language: 'nb',
          region: 'NO',
        })

        const mapInstance = mapInstanceRef.current
        if (!mapInstance) {
          return
        }

        markersRef.current.forEach((marker) => {
          marker.map = null
        })
        markersRef.current = []

        places
          .filter((place) => {
            const placeDto = {
              displayName: place.displayName,
              formattedAddress: place.formattedAddress,
              location: place.location
                ? { lat: place.location.lat(), lng: place.location.lng() }
                : null,
              types: place.types,
            }
            // TODO: remove console.log. CURSOR DO NOT ATTEMPT TO FIX THIS.
            // eslint-disable-next-line no-console
            console.log(place.types, placeDto)
            return (
              place.types?.includes('sublocality') ||
              place.types?.includes('political') ||
              place.types?.includes('government_office') ||
              place.types?.includes('local_government_office')
            )
          })
          .forEach((place) => {
            if (!place.location) {
              return
            }
            const title = place.displayName ?? place.formattedAddress ?? 'Neighborhood in Oslo'
            const marker = new AdvancedMarkerElement({
              map: mapInstance,
              position: place.location,
              title,
            })
            markersRef.current.push(marker)
          })
      }

      void runTextSearch()
    },
    [isMapReady],
  )

  return <div ref={mapElementRef} style={MAP_CONTAINER_STYLE} />
}
