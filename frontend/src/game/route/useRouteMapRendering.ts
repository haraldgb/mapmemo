import { useEffect, useRef } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import type { RouteAddress, SelectedJunction } from './types'

type Props = {
  startAddress: RouteAddress | null
  endAddress: RouteAddress | null
  path: SelectedJunction[]
  availableJunctions: SelectedJunction[]
  isReady: boolean
  canReachDestination: boolean
  onJunctionClick: (junction: SelectedJunction) => void
  onDestinationClick: () => void
  gameKey: number
}

export const useRouteMapRendering = ({
  startAddress,
  endAddress,
  path,
  availableJunctions,
  isReady,
  canReachDestination,
  onJunctionClick,
  onDestinationClick,
  gameKey,
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
  const hasFittedRef = useRef(false)
  // useRef: keep latest callback without making it a dep of the diff effect,
  // so onJunctionClick identity changes don't trigger full marker re-creation.
  const onJunctionClickRef = useRef(onJunctionClick)
  useEffect(function syncOnJunctionClickRef() {
    onJunctionClickRef.current = onJunctionClick
  })

  // Reset fit-bounds flag when game resets
  useEffect(
    function resetFitOnNewGame() {
      hasFittedRef.current = false
    },
    [gameKey],
  )

  // Place A/B markers when addresses are resolved
  useEffect(
    function placeAddressMarkers() {
      if (!map || !startAddress || !endAddress) {
        return
      }

      // Create start marker (A)
      const startElement = document.createElement('div')
      startElement.textContent = 'A'
      Object.assign(startElement.style, s_addressMarker, {
        background: '#3b82f6',
      })

      const startMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: {
          lat: startAddress.lat,
          lng: startAddress.lng,
        },
        content: startElement,
        title: startAddress.label,
      })
      startMarkerRef.current = startMarker

      // Create end marker (B)
      const endElement = document.createElement('div')
      endElement.textContent = 'B'
      Object.assign(endElement.style, s_addressMarker, {
        background: '#ef4444',
      })

      const endMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: endAddress.lat, lng: endAddress.lng },
        content: endElement,
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
        lat: startAddress.lat,
        lng: startAddress.lng,
      })
      bounds.extend({ lat: endAddress.lat, lng: endAddress.lng })
      for (const junction of availableJunctions) {
        bounds.extend({ lat: junction.lat, lng: junction.lng })
      }
      map.fitBounds(bounds, { top: 80, right: 40, bottom: 40, left: 40 })
    },
    [map, isReady, startAddress, endAddress, availableJunctions],
  )

  // Clean up all dot markers when map instance changes or unmounts
  useEffect(
    function cleanupDotMarkersOnMapChange() {
      if (!map) {
        return
      }
      return () => {
        for (const marker of dotMarkersMapRef.current.values()) {
          marker.map = null
        }
        dotMarkersMapRef.current.clear()
      }
    },
    [map],
  )

  // Diff junction dots — only add/remove changed markers, no full-reset cleanup
  useEffect(
    function renderJunctionDots() {
      if (!map) {
        return
      }

      const nextIds = new Set(availableJunctions.map((i) => i.id))
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
      for (const junction of availableJunctions) {
        if (dotMarkersMapRef.current.has(junction.id)) {
          continue
        }

        const element = document.createElement('div')
        Object.assign(element.style, s_junctionDot, {
          background: '#6f2dbd',
        })
        element.addEventListener('mouseenter', () => {
          element.style.transform = 'scale(1.5)'
          element.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
        })
        element.addEventListener('mouseleave', () => {
          element.style.transform = 'scale(1)'
          element.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
        })

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: junction.lat, lng: junction.lng },
          content: element,
          title: junction.connectedRoadNames.join(', '),
          gmpClickable: true,
        })
        marker.addEventListener('gmp-click', () => {
          onJunctionClickRef.current(junction)
        })
        dotMarkersMapRef.current.set(junction.id, marker)
      }
    },
    [map, availableJunctions],
  )

  // Draw numbered path dots — full re-render on path or availableJunctions change.
  // Same junction can appear multiple times (revisit); indices are grouped and
  // shown as "1·4" (two visits) or "..." (three or more).
  // Path dots that are also in availableJunctions remain clickable.
  useEffect(
    function drawPathDots() {
      if (!map || path.length === 0) {
        return
      }

      const availableIds = new Set(availableJunctions.map((j) => j.id))

      // Group 1-based visit indices by junction ID
      const indicesByJunctionId = new Map<number, number[]>()
      path.forEach((junction, i) => {
        const existing = indicesByJunctionId.get(junction.id) ?? []
        existing.push(i + 1)
        indicesByJunctionId.set(junction.id, existing)
      })

      // One dot per unique junction (first occurrence determines position)
      const uniqueJunctions = path.filter(
        (j, i) => path.findIndex((p) => p.id === j.id) === i,
      )

      const markers = uniqueJunctions.map((junction) => {
        const indices = indicesByJunctionId.get(junction.id)!
        const label =
          indices.length === 1
            ? String(indices[0])
            : indices.length === 2
              ? `${indices[0]}·${indices[1]}`
              : '...'
        const fontSize = indices.length === 2 ? '9px' : '11px'
        const isClickable = availableIds.has(junction.id)

        const element = document.createElement('div')
        element.textContent = label
        Object.assign(element.style, s_pathDot, {
          fontSize,
          cursor: isClickable ? 'pointer' : 'default',
          background: isClickable ? '#6f2dbd' : '#3b82f6',
        })

        element.addEventListener('mouseenter', () => {
          element.style.transform = 'scale(1.5)'
          element.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
        })
        element.addEventListener('mouseleave', () => {
          element.style.transform = 'scale(1)'
          element.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)'
        })

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: junction.lat, lng: junction.lng },
          content: element,
          title: junction.connectedRoadNames.join(', '),
          gmpClickable: isClickable,
        })

        if (isClickable) {
          // Use the availableJunctions version — it has the correct roadName for
          // the current traversal context, which handleJunctionClick needs for
          // direction logic. The path version has the roadName from the original visit.
          const availableJunction = availableJunctions.find(
            (j) => j.id === junction.id,
          )!
          marker.addEventListener('gmp-click', () => {
            onJunctionClickRef.current(availableJunction)
          })
        }

        return marker
      })

      return () => {
        for (const marker of markers) {
          marker.map = null
        }
      }
    },
    [map, path, availableJunctions],
  )

  // Highlight B marker when destination is reachable, attach click handler
  useEffect(
    function highlightDestinationMarker() {
      const marker = endMarkerRef.current
      if (!marker) {
        return
      }
      const element = marker.content as HTMLElement | null
      if (!element) {
        return
      }

      // Inline styles: imperative DOM, not React-rendered (see s_addressMarker comment)
      if (canReachDestination) {
        marker.gmpClickable = true
        element.style.background = '#22c55e'
        element.style.transform = 'scale(1.2)'
        element.style.transition =
          'transform 0.15s ease, background 0.2s, box-shadow 0.15s ease'
        element.style.cursor = 'pointer'

        const handleEnter = () => {
          element.style.transform = 'scale(1.4)'
          element.style.boxShadow = '0 3px 8px rgba(0,0,0,0.4)'
        }
        const handleLeave = () => {
          element.style.transform = 'scale(1.2)'
          element.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'
        }
        const handleClick = () => {
          onDestinationClick()
        }
        element.addEventListener('mouseenter', handleEnter)
        element.addEventListener('mouseleave', handleLeave)
        marker.addEventListener('gmp-click', handleClick)

        return () => {
          element.removeEventListener('mouseenter', handleEnter)
          element.removeEventListener('mouseleave', handleLeave)
          marker.removeEventListener('gmp-click', handleClick)
          marker.gmpClickable = false
        }
      } else {
        marker.gmpClickable = false
        element.style.background = '#ef4444'
        element.style.transform = 'scale(1)'
        element.style.cursor = 'default'
      }
    },
    [canReachDestination, onDestinationClick],
  )
}

// Plain CSS style objects instead of Tailwind: AdvancedMarkerElement content is created
// via document.createElement, outside React's render tree. Tailwind classes only work on
// elements rendered by React (where the class→CSS pipeline runs).
const s_addressMarker: Partial<CSSStyleDeclaration> = {
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
  cursor: 'default',
}

const s_junctionDot: Partial<CSSStyleDeclaration> = {
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  border: '2px solid white',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  cursor: 'pointer',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
}

const s_pathDot: Partial<CSSStyleDeclaration> = {
  color: 'white',
  fontWeight: '700',
  width: '22px',
  height: '22px',
  borderRadius: '50%',
  background: '#3b82f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid white',
  boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  cursor: 'default',
}
