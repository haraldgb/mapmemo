import { useEffect, useRef } from 'react'
import { INITIAL_PREV_GUESS, type AreaGameState } from './useAreaGameState'
import type { MapContext } from '../types'
import {
  createPolygonLabelMarker,
  getFeatureProperty,
} from '../../utils/polygons'
import { ID_KEY } from '../consts'

type Props = {
  areaGameState: AreaGameState
  mapContext: MapContext
  features: google.maps.Data.Feature[]
}

export const useFeatureLabels = ({
  areaGameState,
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
  const wrongClickMarkerRef =
    useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

  const clearMarkers = () => {
    labelMarkersRef.current.forEach((marker) => {
      marker.map = null
    })
    labelMarkersRef.current.clear()
    clearWrongClickMarker()
  }

  const clearWrongClickMarker = () => {
    if (wrongClickMarkerRef.current) {
      wrongClickMarkerRef.current.map = null
      wrongClickMarkerRef.current = null
    }
  }

  useEffect(
    function syncWrongClickLabel() {
      const { isCorrect, clickedFeature } = areaGameState.prevGuess
      clearWrongClickMarker()

      if (isCorrect || !clickedFeature) {
        return
      }
      const map = mapRef.current
      const MarkerConstructor = markerConstructorRef.current
      if (!map || !MarkerConstructor) {
        return
      }
      const marker = createPolygonLabelMarker(
        map,
        clickedFeature,
        MarkerConstructor,
        '#dc2626',
      )
      wrongClickMarkerRef.current = marker
    },
    [areaGameState.prevGuess],
  )

  useEffect(
    function syncLabels() {
      const { id, isCorrect } = areaGameState.prevGuess
      if (!isCorrect || !id) {
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
    [features, areaGameState.prevGuess],
  )

  useEffect(
    function resetLabels() {
      if (areaGameState.prevGuess === INITIAL_PREV_GUESS) {
        clearMarkers()
      }
    },
    [areaGameState.prevGuess],
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
