/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react'
import { GOOGLE_MAPS_API_KEY } from '../../../.secrets/secrets'
import { loadGoogleMapsScript } from './utils/googleMaps'
import { addGeoJsonPolygons } from './utils/polygons'

const OSLO_CENTER = { lat: 59.91, lng: 10.73 }
const MAP_CONTAINER_STYLE: React.CSSProperties = {
  height: '320px',
  width: '720px',
  borderRadius: '12px',
  border: '1px solid #e2e2e2',
}

export const MapMemo = () => {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const hasFetchedRef = useRef(false)
  const polygonCleanupRef = useRef<null | (() => void)>(null)
  const showMarkersRef = useRef(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [showPolygons, setShowPolygons] = useState(false)

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
      if (!showPolygons) {
        if (polygonCleanupRef.current) {
          polygonCleanupRef.current()
          polygonCleanupRef.current = null
        }
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
    [isMapReady, showPolygons],
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
              map: showMarkersRef.current ? mapInstance : null,
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

  useEffect(
    function toggleMarkersOnMapReady() {
      if (!isMapReady || !mapInstanceRef.current) {
        return
      }
      const mapInstance = mapInstanceRef.current
      markersRef.current.forEach((marker) => {
        marker.map = showMarkersRef.current ? mapInstance : null
      })
    },
    [isMapReady],
  )

  return (
    <div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <input
          type="checkbox"
          checked={showPolygons}
          onChange={(event) => setShowPolygons(event.target.checked)}
        />
        Show polygons
      </label>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <input
          type="checkbox"
          defaultChecked={false}
          onChange={(event) => {
            showMarkersRef.current = event.target.checked
            if (!mapInstanceRef.current) {
              return
            }
            const mapInstance = mapInstanceRef.current
            markersRef.current.forEach((marker) => {
              marker.map = showMarkersRef.current ? mapInstance : null
            })
          }}
        />
        Show markers
      </label>
      <div ref={mapElementRef} style={MAP_CONTAINER_STYLE} />
    </div>
  )
}
