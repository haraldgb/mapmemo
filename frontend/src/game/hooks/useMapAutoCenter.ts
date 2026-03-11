import { useEffect, useRef } from 'react'
import type { GameEntry } from '../types'
import type { PrevGuess } from './useAreaGameState'
import { getGeometryCenter } from '../../utils/calculations'

type Props = {
  currentEntry: GameEntry | null
  prevGuess: PrevGuess
  map: google.maps.Map | null
  features: google.maps.Data.Feature[]
  isEnabled: boolean
}

/**
 * Pans the map to center the next area after a correct guess in name mode.
 * Clamps the pan so the viewport edge in the direction of movement does not
 * exceed the play area (bounding box of all features).
 */
export const useMapAutoCenter = ({
  currentEntry,
  prevGuess,
  map,
  features,
  isEnabled,
}: Props): void => {
  const prevEntryIdRef = useRef<string | null>(null)
  const playAreaBoundsRef = useRef<google.maps.LatLngBounds | null>(null)

  useEffect(
    function computePlayAreaBounds() {
      if (!map || features.length === 0) {
        return
      }
      const bounds = new google.maps.LatLngBounds()
      features.forEach((feature) => {
        feature.getGeometry()?.forEachLatLng((latLng) => bounds.extend(latLng))
      })
      playAreaBoundsRef.current = bounds
    },
    [map, features],
  )

  useEffect(
    function autoCenterOnCorrectGuess() {
      if (
        !isEnabled ||
        !map ||
        !currentEntry ||
        !prevGuess.isCorrect ||
        prevGuess.id === ''
      ) {
        return
      }
      if (prevEntryIdRef.current === currentEntry.id) {
        return
      }
      prevEntryIdRef.current = currentEntry.id

      const geometry = currentEntry.feature.getGeometry()
      if (!geometry) {
        return
      }

      const centroid = getGeometryCenter(geometry)
      const playBounds = playAreaBoundsRef.current

      // Reads the CSS var set by useKeyboardHeight (called in GameUI) — no extra listener needed
      const keyboardHeight = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--keyboard-height',
        ) || '0',
      )

      const panTo = (target: google.maps.LatLngLiteral) => {
        map.panTo(target)
        // Offset so the target appears at the visible center above the keyboard.
        // panBy(0, d) with positive d moves the viewport south by d px, placing
        // the target d px north of center — i.e., at the visible center.
        if (keyboardHeight > 0) {
          map.panBy(0, keyboardHeight / 2)
        }
      }

      if (!playBounds) {
        panTo(centroid)
        return
      }

      const mapBounds = map.getBounds()
      const mapCenter = map.getCenter()
      if (!mapBounds || !mapCenter) {
        panTo(centroid)
        return
      }

      const halfLat = mapCenter.lat() - mapBounds.getSouthWest().lat()
      const halfLng = mapBounds.getNorthEast().lng() - mapCenter.lng()

      const south = playBounds.getSouthWest().lat()
      const north = playBounds.getNorthEast().lat()
      const west = playBounds.getSouthWest().lng()
      const east = playBounds.getNorthEast().lng()

      // If viewport is larger than play area in a dimension, center on play area mid
      const clampedLat =
        south + halfLat > north - halfLat
          ? (south + north) / 2
          : Math.max(south + halfLat, Math.min(north - halfLat, centroid.lat))

      const clampedLng =
        west + halfLng > east - halfLng
          ? (west + east) / 2
          : Math.max(west + halfLng, Math.min(east - halfLng, centroid.lng))

      panTo({ lat: clampedLat, lng: clampedLng })
    },
    [isEnabled, map, currentEntry, prevGuess.isCorrect, prevGuess.id],
  )
}
