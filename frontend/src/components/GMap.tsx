import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Spinner } from './Spinner'

type GMapProps = {
  spinUntilReady: boolean
  features: google.maps.Data.Feature[]
  onFeatureClick?: (feature: google.maps.Data.Feature) => void
  onFeatureHover?: (
    feature: google.maps.Data.Feature,
    isHovering: boolean,
  ) => void
  onMapReady: (payload: {
    map: google.maps.Map
    AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
  }) => void
  children?: ReactNode
}

export const GMap = ({
  spinUntilReady,
  features,
  onFeatureClick,
  onFeatureHover,
  onMapReady,
  children,
}: GMapProps) => {
  const map = useMap()
  const markerLibrary = useMapsLibrary('marker')
  const prevFeaturesRef = useRef<Set<google.maps.Data.Feature>>(new Set())
  const handlersRef = useRef({
    onFeatureClick,
    onFeatureHover,
  })

  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(
    function trackHandlerUpdates() {
      handlersRef.current = { onFeatureClick, onFeatureHover }
    },
    [onFeatureClick, onFeatureHover],
  )

  useEffect(
    function updateFullscreenControlOptions() {
      if (!map) {
        return
      }
      map.setOptions({
        fullscreenControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM,
        },
      })
    },
    [map],
  )

  useEffect(
    function notifyMapReadyEffect() {
      if (!map || !markerLibrary?.AdvancedMarkerElement) {
        return
      }
      // TODO: assumes that tiles are added. What if none are?
      const listener = google.maps.event.addListenerOnce(
        map,
        'tilesloaded',
        () => {
          setIsMapReady(true)
          onMapReady({
            map,
            AdvancedMarkerElement: markerLibrary.AdvancedMarkerElement,
          })
        },
      )
      return () => {
        listener.remove()
      }
    },
    [map, markerLibrary, onMapReady],
  )

  useEffect(
    function connectFeatureListeners() {
      if (!map) {
        return
      }
      const listeners: google.maps.MapsEventListener[] = []
      listeners.push(
        map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
          if (!event.feature) {
            return
          }
          handlersRef.current.onFeatureClick?.(event.feature)
        }),
      )
      listeners.push(
        map.data.addListener(
          'mouseover',
          (event: google.maps.Data.MouseEvent) => {
            if (!event.feature) {
              return
            }
            handlersRef.current.onFeatureHover?.(event.feature, true)
          },
        ),
      )
      listeners.push(
        map.data.addListener(
          'mouseout',
          (event: google.maps.Data.MouseEvent) => {
            if (!event.feature) {
              return
            }
            handlersRef.current.onFeatureHover?.(event.feature, false)
          },
        ),
      )
      return () => {
        listeners.forEach((listener) => listener.remove())
      }
    },
    [map],
  )

  useEffect(
    function syncFeaturesEffect() {
      if (!map) {
        return
      }
      const prevFeatures = prevFeaturesRef.current
      const nextFeatures = new Set(features)

      prevFeatures.forEach((feature) => {
        if (!nextFeatures.has(feature)) {
          map.data.remove(feature)
        }
      })

      features.forEach((feature) => {
        if (!prevFeatures.has(feature)) {
          map.data.add(feature)
        }
      })

      prevFeaturesRef.current = nextFeatures
    },
    [map, features],
  )

  useEffect(
    function clearFeaturesOnUnmount() {
      if (!map) {
        return
      }
      return () => {
        prevFeaturesRef.current.forEach((feature) => {
          map.data.remove(feature)
        })
        prevFeaturesRef.current.clear()
      }
    },
    [map],
  )

  const showSpinner = spinUntilReady && !isMapReady
  const mapStatusLabel = map ? 'Drawing map...' : 'Fetching map...'

  return (
    <div
      className={s_map_container}
      aria-busy={!map}
      aria-live='polite'
    >
      <Map
        mapId='5da3993597ca412079e99b4c'
        defaultCenter={{ lat: 59.91, lng: 10.73 }}
        defaultZoom={11}
        mapTypeControl={false}
        fullscreenControl={true}
        streetViewControl={false}
        className={sf_map_canvas(isMapReady)}
        style={{ width: '100%', height: '100%' }}
      />
      {children}
      {showSpinner && (
        <div className={s_loading_overlay}>
          <Spinner />
          {mapStatusLabel}
        </div>
      )}
    </div>
  )
}

const s_map_container =
  'relative flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white'
const sf_map_canvas = (isReady: boolean) =>
  `absolute inset-0 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`
const s_loading_overlay =
  'absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 text-sm font-medium text-slate-600'
