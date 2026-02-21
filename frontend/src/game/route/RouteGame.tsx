import { useEffect, useState } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { GMap } from '../../components/GMap'
import { GameSettingsButton } from '../settings/GameSettingsButton'
import { useGameTimer } from '../hooks/useGameTimer'
import { useRouteMode } from './useRouteMode'
import { useRouteMapRendering } from './useRouteMapRendering'
import { RouteGameHUD } from './RouteGameHUD'
import { RouteResults } from './RouteResults'

import type { SelectedIntersection, SnappedAddress } from './types'

const EMPTY_FEATURES: google.maps.Data.Feature[] = []

export const RouteGame = () => {
  const [isGMapReady, setIsGMapReady] = useState(false)
  const routeMode = useRouteMode()
  const { formattedTime, resetTimer } = useGameTimer({
    isRunning: routeMode.isReady && !routeMode.isComplete,
  })

  const handleMapReady = () => {
    setIsGMapReady(true)
  }

  const handleReset = () => {
    routeMode.reset()
    resetTimer()
    setIsGMapReady(false)
  }

  return (
    <section className={s_section}>
      <GMap
        spinUntilReady
        features={EMPTY_FEATURES}
        onMapReady={handleMapReady}
      >
        {isGMapReady && (
          <>
            <RouteGameHUD
              formattedTime={formattedTime}
              currentRoadName={routeMode.currentRoadName}
              isLoading={routeMode.isLoading}
              canReachDestination={routeMode.canReachDestination}
              endLabel={routeMode.endAddress?.label ?? null}
            />
            <RouteMapInteraction routeMode={routeMode} />
            <div className={s_settings}>
              <GameSettingsButton
                isGameActive={routeMode.path.length > 0}
                resetGameState={handleReset}
              />
            </div>
            {routeMode.isComplete &&
              routeMode.startAddress &&
              routeMode.endAddress && (
                <RouteResults
                  startAddress={routeMode.startAddress}
                  endAddress={routeMode.endAddress}
                  path={routeMode.path}
                  formattedTime={formattedTime}
                  onPlayAgain={handleReset}
                />
              )}
            {routeMode.error && (
              <div className={s_error}>{routeMode.error}</div>
            )}
          </>
        )}
      </GMap>
    </section>
  )
}

// Inner component that has access to the map context via useMap
type RouteMapInteractionProps = {
  routeMode: ReturnType<typeof useRouteMode>
}

const RouteMapInteraction = ({ routeMode }: RouteMapInteractionProps) => {
  const map = useMap()

  useRouteMapRendering({
    startAddress: routeMode.startAddress,
    endAddress: routeMode.endAddress,
    path: routeMode.path,
    availableIntersections: routeMode.availableIntersections,
    isReady: routeMode.isReady,
    canReachDestination: routeMode.canReachDestination,
  })

  useIntersectionClickHandler({
    map,
    availableIntersections: routeMode.availableIntersections,
    onIntersectionClick: routeMode.handleIntersectionClick,
    onDestinationClick: routeMode.handleDestinationClick,
    canReachDestination: routeMode.canReachDestination,
    endAddress: routeMode.endAddress,
  })

  return null
}

// --- Click handler hook ---

type IntersectionClickProps = {
  map: google.maps.Map | null
  availableIntersections: SelectedIntersection[]
  onIntersectionClick: (intersection: SelectedIntersection) => void
  onDestinationClick: () => void
  canReachDestination: boolean
  endAddress: SnappedAddress | null
}

const CLICK_THRESHOLD_METERS = 15

const useIntersectionClickHandler = ({
  map,
  availableIntersections,
  onIntersectionClick,
  onDestinationClick,
  canReachDestination,
  endAddress,
}: IntersectionClickProps) => {
  useEffect(
    function handleMapClicks() {
      if (!map) {
        return
      }

      const listener = map.addListener(
        'click',
        (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) {
            return
          }

          const clickLat = event.latLng.lat()
          const clickLng = event.latLng.lng()

          // Check destination click first
          if (canReachDestination && endAddress) {
            const distToEnd = haversineDistance(
              clickLat,
              clickLng,
              endAddress.snappedLat,
              endAddress.snappedLng,
            )
            if (distToEnd < CLICK_THRESHOLD_METERS) {
              onDestinationClick()
              return
            }
          }

          // Find closest intersection
          let closest: SelectedIntersection | null = null
          let closestDist = Infinity

          for (const ix of availableIntersections) {
            const dist = haversineDistance(clickLat, clickLng, ix.lat, ix.lng)
            if (dist < closestDist) {
              closestDist = dist
              closest = ix
            }
          }

          if (closest && closestDist < CLICK_THRESHOLD_METERS) {
            onIntersectionClick(closest)
          }
        },
      )

      return () => {
        google.maps.event.removeListener(listener)
      }
    },
    [
      map,
      availableIntersections,
      onIntersectionClick,
      onDestinationClick,
      canReachDestination,
      endAddress,
    ],
  )
}

const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const s_section = 'flex min-h-0 flex-1'
const s_settings =
  'pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-2'
const s_error =
  'pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700'
