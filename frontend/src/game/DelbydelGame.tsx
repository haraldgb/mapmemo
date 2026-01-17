/// <reference types="@types/google.maps" />
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GOOGLE_MAPS_API_KEY } from '../../../.secrets/secrets'
import { loadGoogleMapsScript } from '../mapMemo/utils/googleMaps'
import { addGeoJsonPolygons, createPolygonLabelMarker, getDelbydelName } from '../mapMemo/utils/polygons'

const OSLO_CENTER = { lat: 59.91, lng: 10.73 }
const MAP_CONTAINER_STYLE: React.CSSProperties = {
  width: '100%',
  flex: 1,
  borderRadius: '12px',
  border: '1px solid #e2e2e2',
}

const OUTLINE_STYLE: google.maps.Data.StyleOptions = {
  strokeColor: '#6f2dbd',
  strokeOpacity: 0.9,
  strokeWeight: 1.5,
  fillColor: '#6f2dbd',
  fillOpacity: 0,
}
const HOVER_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  fillColor: '#9b9b9b',
  fillOpacity: 0.35,
}
const CORRECT_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#2f9e44',
  fillColor: '#2f9e44',
  fillOpacity: 0.45,
}
const LATE_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#f2c94c',
  fillColor: '#f2c94c',
  fillOpacity: 0.55,
}
const FLASH_STYLE: google.maps.Data.StyleOptions = {
  ...OUTLINE_STYLE,
  strokeColor: '#f2c94c',
  fillColor: '#f2c94c',
  fillOpacity: 0.55,
}

type GameEntry = {
  id: string
  feature: google.maps.Data.Feature
}

const shuffleEntries = (entries: GameEntry[]) => {
  const result = [...entries]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export const DelbydelGame = () => {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const polygonCleanupRef = useRef<null | (() => void)>(null)
  const markerConstructorRef = useRef<typeof google.maps.marker.AdvancedMarkerElement | null>(null)
  const labelMarkersRef = useRef(new Map<string, google.maps.marker.AdvancedMarkerElement>())
  const hoveredIdRef = useRef<string | null>(null)
  const flashIdRef = useRef<string | null>(null)
  const correctIdsRef = useRef<Map<string, 'first' | 'late'>>(new Map())
  const entriesRef = useRef<GameEntry[]>([])
  const currentIndexRef = useRef(0)
  const attemptedCurrentRef = useRef(false)
  const flashTimeoutRef = useRef<number | null>(null)

  const [isMapReady, setIsMapReady] = useState(false)
  const [entries, setEntries] = useState<GameEntry[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState(0)

  const total = entries.length
  const currentEntry = entries[currentIndex] ?? null
  const scorePercent = total === 0 ? 0 : Math.round((firstTryCorrectCount / total) * 100)
  const isComplete = total > 0 && currentIndex >= total

  const getStyleForFeature = useCallback(function getStyleForFeature(feature: google.maps.Data.Feature) {
    const id = getDelbydelName(feature)
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
  }, [])

  const refreshStyles = useCallback(function refreshStyles() {
    const map = mapInstanceRef.current
    if (!map) {
      return
    }
    map.data.setStyle(getStyleForFeature)
  }, [getStyleForFeature])

  const handleFeatureHover = useCallback(
    function handleFeatureHover(feature: google.maps.Data.Feature, isHovering: boolean) {
      const id = getDelbydelName(feature)
      if (!id) {
        return
      }
      if (isHovering) {
        hoveredIdRef.current = id
      } else if (hoveredIdRef.current === id) {
        hoveredIdRef.current = null
      }
      refreshStyles()
    },
    [refreshStyles],
  )

  const flashCorrectTarget = useCallback(function flashCorrectTarget(targetId: string) {
    flashIdRef.current = targetId
    refreshStyles()
    if (flashTimeoutRef.current) {
      window.clearTimeout(flashTimeoutRef.current)
    }
    flashTimeoutRef.current = window.setTimeout(() => {
      flashIdRef.current = null
      refreshStyles()
    }, 650)
  }, [refreshStyles])

  const advanceToNext = useCallback(function advanceToNext(nextIndex: number) {
    currentIndexRef.current = nextIndex
    setCurrentIndex(nextIndex)
    attemptedCurrentRef.current = false
  }, [])

  const handleFeatureClick = useCallback(
    function handleFeatureClick(feature: google.maps.Data.Feature) {
      const targetEntry = entriesRef.current[currentIndexRef.current]
      const isGameComplete = currentIndexRef.current >= entriesRef.current.length
      if (!targetEntry || isGameComplete) {
        return
      }
      const clickedId = getDelbydelName(feature)
      if (!clickedId) {
        return
      }
      if (correctIdsRef.current.has(clickedId)) {
        return
      }
      if (clickedId === targetEntry.id) {
        if (!attemptedCurrentRef.current) {
          setFirstTryCorrectCount((count) => count + 1)
        }
        const result: 'first' | 'late' = attemptedCurrentRef.current ? 'late' : 'first'
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
    },
    [advanceToNext, flashCorrectTarget, refreshStyles],
  )

  useEffect(function initializeMap() {
    let isMounted = true

    const startMap = async () => {
      await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      if (typeof google?.maps?.importLibrary !== 'function') {
        return
      }
      const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary
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
          includeLabels: false,
          style: getStyleForFeature,
          onLoaded: ({ features }) => {
            if (!isActive) {
              return
            }
            const nextEntries = shuffleEntries(
              features
                .map((feature) => {
                  const id = getDelbydelName(feature)
                  if (!id) {
                    return null
                  }
                  return { id, feature }
                })
                .filter((entry): entry is GameEntry => Boolean(entry)),
            )
            entriesRef.current = nextEntries
            setEntries(nextEntries)
            correctIdsRef.current = new Map()
            labelMarkersRef.current.forEach((marker) => {
              marker.map = null
            })
            labelMarkersRef.current.clear()
            attemptedCurrentRef.current = false
            setFirstTryCorrectCount(0)
            advanceToNext(0)
            refreshStyles()
          },
          onFeatureClick: (feature) => handleFeatureClick(feature),
          onFeatureHover: (feature, isHovering) => handleFeatureHover(feature, isHovering),
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
    [advanceToNext, getStyleForFeature, handleFeatureClick, handleFeatureHover, isMapReady, refreshStyles],
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

  const promptText = useMemo(function getPromptText() {
    if (total === 0) {
      return 'Loading delbydeler...'
    }
    if (isComplete) {
      return 'All delbydeler completed!'
    }
    return `Klikk på delbydel: ${currentEntry?.id ?? ''}`
  }, [currentEntry?.id, isComplete, total])

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
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: 600 }}>{promptText}</div>
        <div style={{ fontSize: '18px', color: '#4f4f4f', marginTop: '4px' }}>
          Score: {firstTryCorrectCount}/{total} ({scorePercent}%)
        </div>
      </div>
      <div ref={mapElementRef} style={MAP_CONTAINER_STYLE} />
    </section>
  )
}
