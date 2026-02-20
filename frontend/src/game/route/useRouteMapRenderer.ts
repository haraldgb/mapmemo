import { useEffect, useRef } from 'react'
import type { MapContext } from '../types'
import type { AvailableIntersection } from './useRoadGraph'
import type { LatLng, RouteAddress } from './types'

type RouteMapRendererProps = {
  mapContext: MapContext
  startAddress: RouteAddress
  endAddress: RouteAddress
  routeCoords: LatLng[]
  availableIntersections: AvailableIntersection[]
  isDestinationReachable: boolean
  isComplete: boolean
  onIntersectionClick: (intersection: AvailableIntersection) => void
  onDestinationClick: () => void
}

export type RouteMapRenderer = {
  /** Call when the map becomes ready to set up initial markers. */
  fitBounds: () => void
}

const DOT_SIZE = 14
const DOT_SIZE_HOVER = 18
const SELECTED_COLOR = '#3b82f6'
const AVAILABLE_COLOR = '#f8fafc'
const AVAILABLE_BORDER = '#94a3b8'
const DESTINATION_COLOR = '#ef4444'

const createDotElement = (
  color: string,
  borderColor: string,
  size: number,
): HTMLDivElement => {
  const el = document.createElement('div')
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.borderRadius = '50%'
  el.style.backgroundColor = color
  el.style.border = `2px solid ${borderColor}`
  el.style.cursor = 'pointer'
  el.style.transition = 'width 0.15s, height 0.15s'
  return el
}

const createLabelElement = (text: string, bgColor: string): HTMLDivElement => {
  const el = document.createElement('div')
  el.style.backgroundColor = bgColor
  el.style.color = '#fff'
  el.style.padding = '4px 10px'
  el.style.borderRadius = '6px'
  el.style.fontWeight = '700'
  el.style.fontSize = '14px'
  el.style.whiteSpace = 'nowrap'
  el.textContent = text
  return el
}

export const useRouteMapRenderer = ({
  mapContext,
  startAddress,
  endAddress,
  routeCoords,
  availableIntersections,
  isDestinationReachable,
  isComplete,
  onIntersectionClick,
  onDestinationClick,
}: RouteMapRendererProps): RouteMapRenderer => {
  const startMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const endMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(
    null,
  )
  const dotMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const destinationMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

  // Keep handler refs fresh for closures
  const onIntersectionClickRef = useRef(onIntersectionClick)
  const onDestinationClickRef = useRef(onDestinationClick)
  useEffect(
    function syncHandlerRefs() {
      onIntersectionClickRef.current = onIntersectionClick
      onDestinationClickRef.current = onDestinationClick
    },
    [onIntersectionClick, onDestinationClick],
  )

  // A/B markers — create once, update position when addresses change
  useEffect(
    function syncStartEndMarkers() {
      if (!mapContext) {
        return
      }
      const { map, AdvancedMarkerElement } = mapContext

      // Start marker (A)
      if (!startMarkerRef.current) {
        startMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: { lat: startAddress.lat, lng: startAddress.lng },
          content: createLabelElement(`A: ${startAddress.name}`, '#16a34a'),
          zIndex: 100,
        })
      } else {
        startMarkerRef.current.position = {
          lat: startAddress.lat,
          lng: startAddress.lng,
        }
      }

      // End marker (B)
      if (!endMarkerRef.current) {
        endMarkerRef.current = new AdvancedMarkerElement({
          map,
          position: { lat: endAddress.lat, lng: endAddress.lng },
          content: createLabelElement(`B: ${endAddress.name}`, '#dc2626'),
          zIndex: 100,
        })
      } else {
        endMarkerRef.current.position = {
          lat: endAddress.lat,
          lng: endAddress.lng,
        }
      }

      return function cleanupStartEndMarkers() {
        if (startMarkerRef.current) {
          startMarkerRef.current.map = null
          startMarkerRef.current = null
        }
        if (endMarkerRef.current) {
          endMarkerRef.current.map = null
          endMarkerRef.current = null
        }
      }
    },
    [mapContext, startAddress, endAddress],
  )

  // Intersection dot markers — recreated when available intersections change
  useEffect(
    function syncDotMarkers() {
      if (!mapContext) {
        return
      }
      const { map, AdvancedMarkerElement } = mapContext

      // Clear previous dots
      for (const marker of dotMarkersRef.current) {
        marker.map = null
      }
      dotMarkersRef.current = []

      // Create new dots
      for (const ix of availableIntersections) {
        const dotEl = createDotElement(
          AVAILABLE_COLOR,
          AVAILABLE_BORDER,
          DOT_SIZE,
        )
        dotEl.addEventListener('mouseenter', () => {
          dotEl.style.width = `${DOT_SIZE_HOVER}px`
          dotEl.style.height = `${DOT_SIZE_HOVER}px`
        })
        dotEl.addEventListener('mouseleave', () => {
          dotEl.style.width = `${DOT_SIZE}px`
          dotEl.style.height = `${DOT_SIZE}px`
        })
        dotEl.addEventListener('click', () => {
          onIntersectionClickRef.current(ix)
        })

        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: ix.lat, lng: ix.lng },
          content: dotEl,
          zIndex: 50,
        })
        dotMarkersRef.current.push(marker)
      }

      return function cleanupDotMarkers() {
        for (const marker of dotMarkersRef.current) {
          marker.map = null
        }
        dotMarkersRef.current = []
      }
    },
    [mapContext, availableIntersections],
  )

  // Destination clickable marker — shown when destination is reachable
  useEffect(
    function syncDestinationMarker() {
      if (!mapContext) {
        return
      }
      const { map, AdvancedMarkerElement } = mapContext

      // Clear previous
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.map = null
        destinationMarkerRef.current = null
      }

      if (!isDestinationReachable || isComplete) {
        return
      }

      const dotEl = createDotElement(
        DESTINATION_COLOR,
        DESTINATION_COLOR,
        DOT_SIZE_HOVER,
      )
      dotEl.addEventListener('click', () => {
        onDestinationClickRef.current()
      })

      destinationMarkerRef.current = new AdvancedMarkerElement({
        map,
        position: { lat: endAddress.lat, lng: endAddress.lng },
        content: dotEl,
        zIndex: 75,
      })

      return function cleanupDestinationMarker() {
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.map = null
          destinationMarkerRef.current = null
        }
      }
    },
    [mapContext, isDestinationReachable, isComplete, endAddress],
  )

  // Route polyline — updates as decisions are made
  useEffect(
    function syncPolyline() {
      if (!mapContext || routeCoords.length < 2) {
        if (polylineRef.current) {
          polylineRef.current.setMap(null)
          polylineRef.current = null
        }
        return
      }

      if (!polylineRef.current) {
        polylineRef.current = new google.maps.Polyline({
          map: mapContext.map,
          path: routeCoords,
          strokeColor: SELECTED_COLOR,
          strokeOpacity: 0.9,
          strokeWeight: 4,
          zIndex: 25,
        })
      } else {
        polylineRef.current.setPath(routeCoords)
      }

      return function cleanupPolyline() {
        if (polylineRef.current) {
          polylineRef.current.setMap(null)
          polylineRef.current = null
        }
      }
    },
    [mapContext, routeCoords],
  )

  const fitBounds = () => {
    if (!mapContext) {
      return
    }
    const bounds = new google.maps.LatLngBounds()
    bounds.extend({ lat: startAddress.lat, lng: startAddress.lng })
    bounds.extend({ lat: endAddress.lat, lng: endAddress.lng })
    mapContext.map.fitBounds(bounds, {
      top: 80,
      bottom: 40,
      left: 40,
      right: 40,
    })
  }

  return { fitBounds }
}
