import { useCallback, useEffect, useRef } from 'react'
import type { MapContext } from '../types'
import type { UseRouteModeReturn, SelectableIntersection } from './useRouteMode'

// --- DOM element factories ---

const createDotElement = (isSelected: boolean): HTMLDivElement => {
  const el = document.createElement('div')
  el.style.width = '12px'
  el.style.height = '12px'
  el.style.borderRadius = '50%'
  el.style.border = '2px solid'
  el.style.transition = 'transform 0.15s ease, background-color 0.15s ease'
  el.style.cursor = isSelected ? 'default' : 'pointer'

  if (isSelected) {
    el.style.backgroundColor = '#3b82f6'
    el.style.borderColor = '#2563eb'
  } else {
    el.style.backgroundColor = '#f8fafc'
    el.style.borderColor = '#94a3b8'
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.4)'
      el.style.backgroundColor = '#e2e8f0'
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)'
      el.style.backgroundColor = '#f8fafc'
    })
  }

  return el
}

const createEndpointElement = (
  label: string,
  color: string,
  isPulsing: boolean,
): HTMLDivElement => {
  const el = document.createElement('div')
  el.style.width = '28px'
  el.style.height = '28px'
  el.style.borderRadius = '50%'
  el.style.backgroundColor = color
  el.style.color = '#fff'
  el.style.fontWeight = '700'
  el.style.fontSize = '14px'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.border = '2px solid #fff'
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
  el.textContent = label

  if (isPulsing) {
    el.style.animation = 'pulse 1.5s ease-in-out infinite'
    el.style.cursor = 'pointer'
  }

  return el
}

// --- Hook ---

type Props = {
  mapContext: MapContext
  routeState: UseRouteModeReturn
}

type MarkerEntry = {
  marker: google.maps.marker.AdvancedMarkerElement
  listener?: google.maps.MapsEventListener
}

export const useRouteMapRendering = ({
  mapContext,
  routeState,
}: Props): void => {
  const map = mapContext?.map ?? null
  const MarkerConstructor = mapContext?.AdvancedMarkerElement ?? null

  // Refs for imperative map objects
  const startMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const endMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  )
  const dotMarkersRef = useRef<Map<string, MarkerEntry>>(new Map())
  const selectedMarkersRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement>
  >(new Map())
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  // Ref for click handler to avoid stale closures on dot markers
  const handleClickRef = useRef(routeState.handleIntersectionClick)
  const handleDestClickRef = useRef(routeState.handleDestinationClick)

  useEffect(
    function syncHandlerRefs() {
      handleClickRef.current = routeState.handleIntersectionClick
      handleDestClickRef.current = routeState.handleDestinationClick
    },
    [routeState.handleIntersectionClick, routeState.handleDestinationClick],
  )

  // --- Fit bounds on init ---

  useEffect(
    function fitBoundsToEndpoints() {
      if (!map) {
        return
      }
      const bounds = new google.maps.LatLngBounds()
      bounds.extend({ lat: routeState.start.lat, lng: routeState.start.lng })
      bounds.extend({ lat: routeState.end.lat, lng: routeState.end.lng })
      map.fitBounds(bounds, { top: 80, bottom: 20, left: 20, right: 20 })
    },
    [map, routeState.start, routeState.end],
  )

  // --- A/B endpoint markers ---

  useEffect(
    function syncEndpointMarkers() {
      if (!map || !MarkerConstructor) {
        return
      }

      // Start marker (A) — green
      if (!startMarkerRef.current) {
        startMarkerRef.current = new MarkerConstructor({
          position: { lat: routeState.start.lat, lng: routeState.start.lng },
          map,
          content: createEndpointElement('A', '#16a34a', false),
          title: routeState.start.name,
          zIndex: 10,
        })
      }

      // End marker (B) — red, pulsing when reachable
      const endContent = createEndpointElement(
        'B',
        '#dc2626',
        routeState.canReachEnd,
      )
      if (endMarkerRef.current) {
        endMarkerRef.current.content = endContent
      } else {
        endMarkerRef.current = new MarkerConstructor({
          position: { lat: routeState.end.lat, lng: routeState.end.lng },
          map,
          content: endContent,
          title: routeState.end.name,
          zIndex: 10,
        })
      }

      // Click on B when reachable
      if (routeState.canReachEnd && endMarkerRef.current) {
        const listener = endMarkerRef.current.addListener('gmp-click', () => {
          handleDestClickRef.current()
        })
        return () => {
          listener.remove()
        }
      }
    },
    [
      map,
      MarkerConstructor,
      routeState.start,
      routeState.end,
      routeState.canReachEnd,
    ],
  )

  // --- Intersection dot markers ---

  const makeDotKey = useCallback(function buildDotKey(
    selectable: SelectableIntersection,
  ): string {
    return `${selectable.onRoadName}:${selectable.intersection.id}`
  }, [])

  useEffect(
    function syncDotMarkers() {
      if (!map || !MarkerConstructor) {
        return
      }

      const currentDots = dotMarkersRef.current
      const nextKeys = new Set(
        routeState.availableIntersections.map(makeDotKey),
      )

      // Remove stale dots
      for (const [key, entry] of currentDots) {
        if (!nextKeys.has(key)) {
          entry.listener?.remove()
          entry.marker.map = null
          currentDots.delete(key)
        }
      }

      // Add new dots
      for (const selectable of routeState.availableIntersections) {
        const key = makeDotKey(selectable)
        if (currentDots.has(key)) {
          continue
        }

        const content = createDotElement(false)
        const marker = new MarkerConstructor({
          position: {
            lat: selectable.intersection.lat,
            lng: selectable.intersection.lng,
          },
          map,
          content,
          zIndex: 5,
        })
        const listener = marker.addListener('gmp-click', () => {
          handleClickRef.current(selectable)
        })
        currentDots.set(key, { marker, listener })
      }
    },
    [map, MarkerConstructor, routeState.availableIntersections, makeDotKey],
  )

  // --- Selected intersection markers (blue, persistent) ---

  useEffect(
    function syncSelectedMarkers() {
      if (!map || !MarkerConstructor) {
        return
      }

      const current = selectedMarkersRef.current
      for (const decision of routeState.decisions) {
        const key = `${decision.fromRoadName}:${decision.intersection.id}`
        if (current.has(key)) {
          continue
        }

        const content = createDotElement(true)
        const marker = new MarkerConstructor({
          position: {
            lat: decision.intersection.lat,
            lng: decision.intersection.lng,
          },
          map,
          content,
          zIndex: 6,
        })
        current.set(key, marker)
      }
    },
    [map, MarkerConstructor, routeState.decisions],
  )

  // --- Route polyline ---

  useEffect(
    function syncPolyline() {
      if (!map) {
        return
      }

      if (!polylineRef.current) {
        polylineRef.current = new google.maps.Polyline({
          map,
          strokeColor: '#3b82f6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
          zIndex: 3,
        })
      }

      polylineRef.current.setPath(routeState.selectedRoute)
    },
    [map, routeState.selectedRoute],
  )

  // --- Cleanup on unmount ---

  useEffect(function cleanupOnUnmount() {
    return () => {
      if (startMarkerRef.current) {
        startMarkerRef.current.map = null
      }
      if (endMarkerRef.current) {
        endMarkerRef.current.map = null
      }
      dotMarkersRef.current.forEach((entry) => {
        entry.listener?.remove()
        entry.marker.map = null
      })
      dotMarkersRef.current.clear()
      selectedMarkersRef.current.forEach((marker) => {
        marker.map = null
      })
      selectedMarkersRef.current.clear()
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
    }
  }, [])
}
