import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import type { SelectedIntersection, SnappedAddress } from './types'

type Props = {
  startAddress: SnappedAddress | null
  endAddress: SnappedAddress | null
  path: SelectedIntersection[]
  availableIntersections: SelectedIntersection[]
  isReady: boolean
  canReachDestination: boolean
}

export const useRouteMapRendering = ({
  startAddress,
  endAddress,
  path,
  availableIntersections,
  isReady,
  canReachDestination,
}: Props): void => {
  const map = useMap()

  // useRef: imperative Google Maps objects that must be cleaned up manually.
  // These don't trigger re-renders and have their own lifecycle.
  const startMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const endMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  )
  const dotMarkersMapRef = useRef<
    Map<number, google.maps.marker.AdvancedMarkerElement>
  >(new Map())
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const hasFittedRef = useRef(false)

  // Place A/B markers when addresses are resolved
  useEffect(
    function placeEndpointMarkers() {
      if (!map || !startAddress || !endAddress) {
        return
      }

      // Create start marker (A)
      const startEl = document.createElement('div')
      startEl.textContent = 'A'
      startEl.className = 'route-marker route-marker-start'
      Object.assign(startEl.style, {
        background: '#3b82f6',
        color: 'white',
        fontWeight: '700',
        fontSize: '14px',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      })

      const startMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: {
          lat: startAddress.snappedLat,
          lng: startAddress.snappedLng,
        },
        content: startEl,
        title: startAddress.label,
      })
      startMarkerRef.current = startMarker

      // Create end marker (B)
      const endEl = document.createElement('div')
      endEl.textContent = 'B'
      Object.assign(endEl.style, {
        background: '#ef4444',
        color: 'white',
        fontWeight: '700',
        fontSize: '14px',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      })

      const endMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: endAddress.snappedLat, lng: endAddress.snappedLng },
        content: endEl,
        title: endAddress.label,
      })
      endMarkerRef.current = endMarker

      return () => {
        startMarker.map = null
        endMarker.map = null
        startMarkerRef.current = null
        endMarkerRef.current = null
      }
    },
    [map, startAddress, endAddress],
  )

  // Fit bounds once on first load only
  useEffect(
    function fitInitialBounds() {
      if (!map || !isReady || !startAddress || !endAddress) {
        return
      }
      if (hasFittedRef.current) {
        return
      }
      hasFittedRef.current = true

      const bounds = new google.maps.LatLngBounds()
      bounds.extend({
        lat: startAddress.snappedLat,
        lng: startAddress.snappedLng,
      })
      bounds.extend({ lat: endAddress.snappedLat, lng: endAddress.snappedLng })
      for (const ix of availableIntersections) {
        bounds.extend({ lat: ix.lat, lng: ix.lng })
      }
      map.fitBounds(bounds, { top: 80, right: 40, bottom: 40, left: 40 })
    },
    [map, isReady, startAddress, endAddress, availableIntersections],
  )

  // Render intersection dots — diff by ID to avoid flash on update
  useEffect(
    function renderIntersectionDots() {
      if (!map) {
        return
      }

      const nextIds = new Set(availableIntersections.map((ix) => ix.id))
      const prevIds = new Set(dotMarkersMapRef.current.keys())

      // Remove markers no longer in the list
      for (const id of prevIds) {
        if (!nextIds.has(id)) {
          const marker = dotMarkersMapRef.current.get(id)
          if (marker) {
            marker.map = null
          }
          dotMarkersMapRef.current.delete(id)
        }
      }

      // Add markers that are new
      for (const ix of availableIntersections) {
        if (dotMarkersMapRef.current.has(ix.id)) {
          continue
        }

        const el = document.createElement('div')
        Object.assign(el.style, {
          background: '#6f2dbd',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        })
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'scale(1.5)'
          el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
        })
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'scale(1)'
          el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
        })

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: ix.lat, lng: ix.lng },
          content: el,
          title: ix.otherRoadName,
        })
        dotMarkersMapRef.current.set(ix.id, marker)
      }

      return () => {
        for (const marker of dotMarkersMapRef.current.values()) {
          marker.map = null
        }
        dotMarkersMapRef.current.clear()
      }
    },
    [map, availableIntersections],
  )

  // Draw route polyline through path
  useEffect(
    function drawRoutePolyline() {
      if (!map || !startAddress) {
        return
      }

      // Remove old polyline
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
      }

      if (path.length === 0) {
        polylineRef.current = null
        return
      }

      const points = [
        { lat: startAddress.snappedLat, lng: startAddress.snappedLng },
        ...path.map((p) => ({ lat: p.lat, lng: p.lng })),
      ]

      const polyline = new google.maps.Polyline({
        path: points,
        strokeColor: '#3b82f6',
        strokeWeight: 4,
        strokeOpacity: 0.8,
        map,
      })
      polylineRef.current = polyline

      return () => {
        polyline.setMap(null)
      }
    },
    [map, startAddress, path],
  )

  // Highlight B marker when destination is reachable
  useEffect(
    function highlightDestinationMarker() {
      if (!endMarkerRef.current) {
        return
      }
      const el = endMarkerRef.current.content as HTMLElement | null
      if (!el) {
        return
      }

      if (canReachDestination) {
        el.style.background = '#22c55e'
        el.style.transform = 'scale(1.2)'
        el.style.transition =
          'transform 0.15s ease, background 0.2s, box-shadow 0.15s ease'
        el.style.cursor = 'pointer'

        const handleEnter = () => {
          el.style.transform = 'scale(1.4)'
          el.style.boxShadow = '0 3px 8px rgba(0,0,0,0.4)'
        }
        const handleLeave = () => {
          el.style.transform = 'scale(1.2)'
          el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
        }
        el.addEventListener('mouseenter', handleEnter)
        el.addEventListener('mouseleave', handleLeave)

        return () => {
          el.removeEventListener('mouseenter', handleEnter)
          el.removeEventListener('mouseleave', handleLeave)
        }
      } else {
        el.style.background = '#ef4444'
        el.style.transform = 'scale(1)'
        el.style.cursor = 'default'
      }
    },
    [canReachDestination],
  )
}
