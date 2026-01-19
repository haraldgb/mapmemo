/// <reference types="@types/google.maps" />
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { loadGoogleMapsScript } from '../mapMemo/utils/googleMaps'
import { fetchGoogleMapsApiKey } from '../mapMemo/utils/googleMapsApiKey'
import {
  addGeoJsonPolygons,
  createPolygonLabelMarker,
  getFeatureLabel,
} from '../mapMemo/utils/polygons'
import {
  CORRECT_STYLE,
  DELBYDELER_GEOJSON_URL,
  FLASH_STYLE,
  HOVER_STYLE,
  LATE_STYLE,
  MAP_CONTAINER_STYLE,
  MODE_OPTIONS,
  OSLO_CENTER,
  OUTLINE_STYLE,
  SUB_DISTRICT_KEY,
} from './consts.ts'
import {
  createSeededRng,
  isValidSeed,
  randomSeed,
  shuffleEntriesWithRng,
} from './utils.ts'
import type { GameEntry } from './types.ts'

export const DelbydelGame = () => {
  const [urlQueryParams] = useSearchParams()
  const seedParam = urlQueryParams.get('seed') ?? ''
  const fallbackSeedRef = useRef<string>(randomSeed())
  const effectiveSeed = isValidSeed(seedParam)
    ? seedParam
    : fallbackSeedRef.current

  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const polygonCleanupRef = useRef<null | (() => void)>(null)
  const markerConstructorRef = useRef<
    typeof google.maps.marker.AdvancedMarkerElement | null
  >(null)
  const labelMarkersRef = useRef(
    new Map<string, google.maps.marker.AdvancedMarkerElement>(),
  )
  const hoveredIdRef = useRef<string | null>(null)
  const flashIdRef = useRef<string | null>(null)
  const correctIdsRef = useRef<Map<string, 'first' | 'late'>>(new Map())
  const entriesRef = useRef<GameEntry[]>([])
  const allEntriesRef = useRef<GameEntry[]>([])
  const baseOrderRef = useRef<GameEntry[]>([])
  const currentIndexRef = useRef(0)
  const attemptedCurrentRef = useRef(false)
  const flashTimeoutRef = useRef<number | null>(null)

  const [isMapReady, setIsMapReady] = useState(false)
  const [modeCount, setModeCount] = useState(10)
  const [entries, setEntries] = useState<GameEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0)
  const [lateCorrectCount, setLateCorrectCount] = useState(0)

  const total = entries.length
  const currentEntry = entries[currentIndex] ?? null
  const answeredCount = firstTryCorrectCount + lateCorrectCount
  const scorePercent =
    answeredCount === 0
      ? 0
      : Math.round((firstTryCorrectCount / answeredCount) * 100)
  const isComplete = total > 0 && currentIndex >= total

  const getStyleForFeature = (feature: google.maps.Data.Feature) => {
    const id = getFeatureLabel(feature, SUB_DISTRICT_KEY)
    if (!id) {
      return OUTLINE_STYLE
    }
    if (flashIdRef.current === id) {
      return FLASH_STYLE
    }
    const correctResult = correctIdsRef.current.get(id)
    if (correctResult === 'first') {
      return CORRECT_STYLE
    }
    if (correctResult === 'late') {
      return LATE_STYLE
    }
    if (hoveredIdRef.current === id) {
      return HOVER_STYLE
    }
    return OUTLINE_STYLE
  }

  const refreshStyles = () => {
    const map = mapInstanceRef.current
    if (!map) {
      return
    }
    map.data.setStyle(getStyleForFeature)
  }

  const handleFeatureHover = (
    feature: google.maps.Data.Feature,
    isHovering: boolean,
  ) => {
    const id = getFeatureLabel(feature, SUB_DISTRICT_KEY)
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

  const resetGameState = () => {
    correctIdsRef.current = new Map()
    labelMarkersRef.current.forEach((marker) => {
      marker.map = null
    })
    labelMarkersRef.current.clear()
    attemptedCurrentRef.current = false
    setFirstTryCorrectCount(0)
    setLateCorrectCount(0)
    flashIdRef.current = null
    hoveredIdRef.current = null
    currentIndexRef.current = 0
    setCurrentIndex(0)
  }

  const applyModeEntries = (sourceEntries: GameEntry[], count: number) => {
    const maxCount = Math.min(count, sourceEntries.length)
    const nextEntries = sourceEntries.slice(0, maxCount)
    entriesRef.current = nextEntries
    setEntries(nextEntries)
    resetGameState()
    refreshStyles()
  }

  const getSeededOrder = (sourceEntries: GameEntry[]) => {
    const rng = createSeededRng(effectiveSeed)
    return shuffleEntriesWithRng(sourceEntries, rng)
  }

  const handlePolygonsLoaded = useEffectEvent(
    function handlePolygonsLoadedEvent(features: google.maps.Data.Feature[]) {
      const rawEntries = features
        .map((feature) => {
          const id = getFeatureLabel(feature, SUB_DISTRICT_KEY)
          if (!id) {
            throw new Error('No id found for maps data feature')
          }
          return { id, feature }
        })
        .filter((entry): entry is GameEntry => Boolean(entry))
      allEntriesRef.current = rawEntries
      const seededEntries = getSeededOrder(rawEntries)
      baseOrderRef.current = seededEntries
      applyModeEntries(seededEntries, modeCount)
    },
  )

  const advanceToNext = (nextIndex: number) => {
    currentIndexRef.current = nextIndex
    setCurrentIndex(nextIndex)
    attemptedCurrentRef.current = false
  }

  const handleFeatureClick = (feature: google.maps.Data.Feature) => {
    const targetEntry = entriesRef.current[currentIndexRef.current]
    const isGameComplete = currentIndexRef.current >= entriesRef.current.length
    if (!targetEntry || isGameComplete) {
      return
    }
    const clickedId = getFeatureLabel(feature, SUB_DISTRICT_KEY)
    if (!clickedId) {
      return
    }
    if (correctIdsRef.current.has(clickedId)) {
      return
    }
    if (clickedId === targetEntry.id) {
      if (!attemptedCurrentRef.current) {
        setFirstTryCorrectCount((count) => count + 1)
      } else {
        setLateCorrectCount((count) => count + 1)
      }
      const result: 'first' | 'late' = attemptedCurrentRef.current
        ? 'late'
        : 'first'
      const nextCorrect = new Map(correctIdsRef.current)
      nextCorrect.set(clickedId, result)
      correctIdsRef.current = nextCorrect

      if (markerConstructorRef.current && mapInstanceRef.current) {
        if (!labelMarkersRef.current.has(clickedId)) {
          const marker = createPolygonLabelMarker(
            mapInstanceRef.current,
            feature,
            markerConstructorRef.current,
          )

          if (marker) {
            labelMarkersRef.current.set(clickedId, marker)
          }
        }
      }

      refreshStyles()
      advanceToNext(currentIndexRef.current + 1)
      return
    }
    attemptedCurrentRef.current = true
    flashCorrectTarget(targetEntry.id)
  }

  useEffect(function initializeMap() {
    let isMounted = true

    const startMap = async () => {
      const apiKey = await fetchGoogleMapsApiKey()
      await loadGoogleMapsScript(apiKey)

      if (typeof google?.maps?.importLibrary !== 'function') {
        return
      }

      const { Map } = (await google.maps.importLibrary(
        'maps',
      )) as google.maps.MapsLibrary
      const { AdvancedMarkerElement } = (await google.maps.importLibrary(
        'marker',
      )) as google.maps.MarkerLibrary

      if (!isMounted || !mapElementRef.current || mapInstanceRef.current) {
        return
      }

      try {
        mapInstanceRef.current = new Map(mapElementRef.current, {
          mapId: '5da3993597ca412079e99b4c',
          center: OSLO_CENTER,
          zoom: 11,
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

      markerConstructorRef.current = AdvancedMarkerElement
      setIsMapReady(true)
    }

    void startMap()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(
    function renderGamePolygons() {
      if (!isMapReady || !mapInstanceRef.current) {
        return
      }
      const mapInstance = mapInstanceRef.current
      let isActive = true

      const addPolygons = async () => {
        const cleanup = await addGeoJsonPolygons(mapInstance, {
          url: DELBYDELER_GEOJSON_URL,
          style: getStyleForFeature,
          onLoaded: ({ features }) => {
            if (!isActive) {
              return
            }
            handlePolygonsLoaded(features)
          },
          onFeatureClick: (feature) => handleFeatureClick(feature),
          onFeatureHover: (feature, isHovering) =>
            handleFeatureHover(feature, isHovering),
        })
        if (!isActive) {
          cleanup?.()
          return
        }
        polygonCleanupRef.current = cleanup ?? null
        refreshStyles()
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
    [
      applyModeEntries,
      advanceToNext,
      getSeededOrder,
      getStyleForFeature,
      handleFeatureClick,
      handleFeatureHover,
      isMapReady,
      refreshStyles,
    ],
  )

  useEffect(
    function applyModeOnChange() {
      if (allEntriesRef.current.length === 0) {
        return
      }
      const seededEntries = getSeededOrder(allEntriesRef.current)
      baseOrderRef.current = seededEntries
      applyModeEntries(seededEntries, modeCount)
    },
    [applyModeEntries, getSeededOrder, modeCount],
  )

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
      ? 'Loading delbydeler...'
      : isComplete
        ? 'All delbydeler completed!'
        : `Klikk på delbydel: ${currentEntry?.id ?? ''}`

  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100vh',
        width: '100vw',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            gap: '8px',
            justifySelf: 'center',
            paddingTop: '4px',
          }}
        >
          {MODE_OPTIONS.map((mode) => {
            const isActive = mode.value === modeCount
            return (
              <button
                key={mode.value}
                type='button'
                onClick={() => setModeCount(mode.value)}
                style={{
                  borderRadius: '999px',
                  border: isActive ? '1px solid #6f2dbd' : '1px solid #d0d0d0',
                  padding: '6px 12px',
                  background: isActive ? '#6f2dbd' : '#ffffff',
                  color: isActive ? '#ffffff' : '#3f3f3f',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
        <div style={{ textAlign: 'center', fontSize: '22px', fontWeight: 600 }}>
          {promptText}
        </div>
        <div
          style={{
            fontSize: '18px',
            color: 'rgba(200, 200, 200, 0.7)',
            justifySelf: 'center',
          }}
        >
          <span style={{ color: '#2f9e44', fontWeight: 600 }}>
            Riktig: {firstTryCorrectCount}
          </span>
          <span style={{ margin: '0 6px' }}>-</span>
          <span style={{ color: '#e03131', fontWeight: 600 }}>
            Feil: {lateCorrectCount}
          </span>{' '}
          <span style={{ margin: '0 6px' }}>-</span>
          {scorePercent}%
        </div>
      </div>
      <div
        ref={mapElementRef}
        style={MAP_CONTAINER_STYLE}
      />
    </section>
  )
}
