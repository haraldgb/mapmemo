import { useEffect, useRef } from 'react'
import { INITIAL_PREV_GUESS, type GameState } from './useGameState'
import type { MapContext } from '../types'
import {
  createPolygonLabelMarker,
  getFeatureProperty,
} from '../../utils/polygons'
import { ID_KEY } from '../consts'

type Props = {
  gameState: GameState
  mapContext: MapContext
  features: google.maps.Data.Feature[]
}

export const useFeatureLabels = ({
  gameState,
  mapContext,
  features,
}: Props) => {
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerConstructorRef = useRef<
    typeof google.maps.marker.AdvancedMarkerElement | null
  >(null)
  const labelMarkersRef = useRef(
    new Map<string, google.maps.marker.AdvancedMarkerElement>(),
  )

  const clearMarkers = () => {
    labelMarkersRef.current.forEach((marker) => {
      marker.map = null
    })
    labelMarkersRef.current.clear()
  }

  useEffect(
    function syncLabels() {
      const { id, isCorrect } = gameState.prevGuess
      if (!isCorrect || !id) {
        // sync is only needed on a correct guess
        return
      }
      const map = mapRef.current
      const MarkerConstructor = markerConstructorRef.current
      if (!map || !MarkerConstructor) {
        return
      }
      if (labelMarkersRef.current.has(id)) {
        return
      }
      const feature = features.find(
        (candidate) => getFeatureProperty(candidate, ID_KEY) === id,
      )
      if (!feature) {
        return
      }
      const marker = createPolygonLabelMarker(map, feature, MarkerConstructor)
      if (marker) {
        labelMarkersRef.current.set(id, marker)
      }
    },
    [features, gameState.prevGuess.id, gameState.prevGuess.isCorrect],
  )

  useEffect(
    function resetLabels() {
      if (
        gameState.prevGuess === INITIAL_PREV_GUESS
        // gameState.correctCount === 0 &&
        // gameState.incorrectCount === 0 &&
        // isInitialPrevGuess(gameState.prevGuess)
      ) {
        clearMarkers()
      }
    },
    [gameState.prevGuess],
  )

  useEffect(
    function updateMapContext() {
      mapRef.current = mapContext?.map ?? null
      markerConstructorRef.current = mapContext?.AdvancedMarkerElement ?? null
    },
    [mapContext],
  )
  useEffect(function cleanupOnUnmount() {
    return () => {
      clearMarkers()
    }
  }, [])
}
