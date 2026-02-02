import { useEffect, useRef, useState } from 'react'
import {
  CORRECT_STYLE,
  LATE_STYLE,
  FLASH_STYLE,
  HOVER_STYLE,
  OUTLINE_STYLE,
  SUB_AREA_KEY,
} from './consts'
import { createPolygonLabelMarker, getFeatureLabel } from '../utils/polygons'
import { createSeededRng, getAreaId, shuffleEntriesWithRng } from './utils'
import type { GameEntry } from './types'
import { useSeedFromUrl } from './hooks/utilHooks'

// TODO: In general this file has to many refs, and styling
type MapContext = {
  map: google.maps.Map
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
} | null

type UseGameStateProps = {
  features: google.maps.Data.Feature[]
  mapContext: MapContext
}

export type GameState = {
  promptText: string
  correctCount: number
  incorrectCount: number
  // correctlyGuessedIds: string[]
  // incorrectlyGuessedIds: string[]
  scorePercent: number
  isGameActive: boolean
  onFeatureClick: (feature: google.maps.Data.Feature) => void
  onFeatureHover: (
    feature: google.maps.Data.Feature,
    isHovering: boolean,
  ) => void
  resetGameState: () => void
}

export const useGameState = ({
  features,
  mapContext,
}: UseGameStateProps): GameState => {
  const rngSeed = useSeedFromUrl()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPrevIncorrect, setIsPrevIncorrect] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const answeredCount = correctCount + incorrectCount

  const createSeededEntries = () => {
    const rawEntries = features
      .map((feature) => {
        const id = getFeatureLabel(feature, SUB_AREA_KEY)
        const areaId = getAreaId(feature) ?? ''
        return { id, feature, areaId }
      })
      .filter((entry): entry is GameEntry => Boolean(entry))
    const rng = createSeededRng(rngSeed)
    const seededEntries = shuffleEntriesWithRng(rawEntries, rng)
    return seededEntries
  }
  const entries = createSeededEntries()

  const scorePercent =
    answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100)
  const total = entries.length
  const currentEntry = entries[currentIndex] ?? null
  // const answeredCount = correctAttemptCount + incorrectAttemptCount
  const isComplete = total > 0 && currentIndex >= total
  const isGameActive =
    entries.length > 0 && !isComplete && (currentIndex > 0 || answeredCount > 0)

  const mapRef = useRef<google.maps.Map | null>(null)
  const markerConstructorRef = useRef<
    typeof google.maps.marker.AdvancedMarkerElement | null
  >(null)
  const labelMarkersRef = useRef(
    new Map<string, google.maps.marker.AdvancedMarkerElement>(),
  )
  const hoveredIdRef = useRef<string | null>(null)
  const flashIdRef = useRef<string | null>(null)
  const flashTimeoutRef = useRef<number | null>(null)

  // ref used in styling callback for gmap.
  const correctlyGuessedIdsRef = useRef<Set<string>>(new Set())
  const lateGuessedIdsRef = useRef<Set<string>>(new Set())
  const answeredIdsRef = useRef<Set<string>>(new Set())

  // ------------------------------------------------------------ //

  // const [entries, setEntries] = useState<GameEntry[]>([])
  // const {
  //   currentIndex,
  //   isPrevIncorrect: isPrevAttemptIncorrect,
  //   correctCount: correctAttemptCount,
  //   incorrectCount: incorrectAttemptCount,
  //   correctlyGuessedIds,
  //   incorrectlyGuessedIds,
  // } = gameProgress

  // TODO: STYLING DOES NOT BELONG HERE------------------- //
  const getStyleForFeature = (feature: google.maps.Data.Feature) => {
    const id = getFeatureLabel(feature, SUB_AREA_KEY)
    if (!id) {
      return OUTLINE_STYLE
    }
    if (flashIdRef.current === id) {
      return FLASH_STYLE
    }
    if (correctlyGuessedIdsRef.current.has(id)) {
      return CORRECT_STYLE
    }
    if (lateGuessedIdsRef.current.has(id)) {
      return LATE_STYLE
    }
    if (hoveredIdRef.current === id) {
      return HOVER_STYLE
    }
    return OUTLINE_STYLE
  }

  const refreshStyles = () => {
    const map = mapRef.current
    if (!map) {
      return
    }
    map.data.setStyle(getStyleForFeature)
  }

  const handleFeatureHover = (
    feature: google.maps.Data.Feature,
    isHovering: boolean,
  ) => {
    const id = getFeatureLabel(feature, SUB_AREA_KEY)
    if (!id) {
      return
    }
    if (isHovering) {
      hoveredIdRef.current = id
    } else if (hoveredIdRef.current === id) {
      hoveredIdRef.current = null
    }
    refreshStyles()
  }

  const flashCorrectTarget = (targetId: string, duration: number = 650) => {
    flashIdRef.current = targetId
    refreshStyles()
    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current)
    }
    flashTimeoutRef.current = window.setTimeout(() => {
      flashIdRef.current = null
      refreshStyles()
    }, duration)
  }
  // TODO: Take a look at other ways of doing this
  useEffect(
    function updateMapContextEffect() {
      mapRef.current = mapContext?.map ?? null
      markerConstructorRef.current = mapContext?.AdvancedMarkerElement ?? null
      refreshStyles()
    },
    [mapContext],
  )

  // ---------END OF STYLING DOES NOT BELONG HERE------------------- //

  const resetGameState = () => {
    correctlyGuessedIdsRef.current = new Set()
    answeredIdsRef.current = new Set()
    labelMarkersRef.current.forEach((marker) => {
      marker.map = null
    })
    labelMarkersRef.current.clear()
    setCurrentIndex(0)
    setIsPrevIncorrect(false)
    setCorrectCount(0)
    setIncorrectCount(0)
    correctlyGuessedIdsRef.current = new Set()
    lateGuessedIdsRef.current = new Set()
    flashIdRef.current = null
    hoveredIdRef.current = null
  }

  const advanceToNext = () => {
    setCurrentIndex(currentIndex + 1)
    setIsPrevIncorrect(false)
  }

  const handleFeatureClick = (feature: google.maps.Data.Feature) => {
    const targetEntry = entries[currentIndex]
    const isGameComplete = currentIndex >= entries.length
    if (!targetEntry || isGameComplete) {
      return
    }
    const clickedId = getFeatureLabel(feature, SUB_AREA_KEY)
    if (!clickedId) {
      return
    }
    if (answeredIdsRef.current.has(clickedId)) {
      return
    }

    if (clickedId !== targetEntry.id) {
      if (!isPrevIncorrect) {
        setIsPrevIncorrect(true)
        setIncorrectCount((prev) => prev + 1)
      }
      flashCorrectTarget(targetEntry.id)
      return
    }
    // TODO: refactor to own function or smth, move to advanceToNext()?
    if (!isPrevIncorrect) {
      setCorrectCount((prev) => prev + 1)
      correctlyGuessedIdsRef.current.add(clickedId)
    } else {
      lateGuessedIdsRef.current.add(clickedId)
    }
    answeredIdsRef.current.add(clickedId)

    if (markerConstructorRef.current && mapRef.current) {
      if (!labelMarkersRef.current.has(clickedId)) {
        const marker = createPolygonLabelMarker(
          mapRef.current,
          feature,
          markerConstructorRef.current,
        )

        if (marker) {
          labelMarkersRef.current.set(clickedId, marker)
        }
      }
    }
    refreshStyles()
    advanceToNext()
    return
  }

  useEffect(function cleanupOnUnmount() {
    const markers = labelMarkersRef.current
    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
      markers.forEach((marker) => {
        marker.map = null
      })
      markers.clear()
    }
  }, [])

  const promptText =
    total === 0
      ? 'Loading areas...'
      : isComplete
        ? 'All areas covered!'
        : `Click area: ${currentEntry?.id ?? ''}`

  return {
    promptText,
    correctCount,
    incorrectCount,
    scorePercent,
    isGameActive,
    onFeatureClick: handleFeatureClick,
    onFeatureHover: handleFeatureHover,
    resetGameState,
  }
}
