import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { GMap } from '../../components/GMap'
import { useRouteMode } from './useRouteMode'
import { useRouteMapRenderer } from './useRouteMapRenderer'
import { useGameTimer } from '../hooks/useGameTimer'
import { RouteResults } from './RouteResults'
import { GameSettingsButton } from '../settings/GameSettingsButton'
import type { MapContext } from '../types'

export const RouteGame = () => {
  const { seed } = useSelector((state: RootState) => state.mapmemo.gameSettings)

  const [mapContext, setMapContext] = useState<MapContext>(null)
  const [isGMapReady, setIsGMapReady] = useState(false)

  const routeMode = useRouteMode({ seed })
  const isPlaying =
    routeMode.phase.status === 'at-start' ||
    routeMode.phase.status === 'at-intersection'
  const { formattedTime, elapsedMs, resetTimer } = useGameTimer({
    isRunning: isPlaying,
  })

  const renderer = useRouteMapRenderer({
    mapContext,
    startAddress: routeMode.startAddress,
    endAddress: routeMode.endAddress,
    routeCoords: routeMode.routeCoords,
    availableIntersections: routeMode.availableIntersections,
    isDestinationReachable: routeMode.isDestinationReachable,
    isComplete: routeMode.isComplete,
    onIntersectionClick: routeMode.handleIntersectionClick,
    onDestinationClick: routeMode.handleDestinationClick,
  })

  const handleMapReady = (payload: MapContext) => {
    setMapContext(payload)
    setIsGMapReady(true)
    renderer.fitBounds()
  }

  const handlePlayAgain = () => {
    routeMode.reset()
    resetTimer()
  }

  const promptText = routeMode.isComplete
    ? 'Route complete!'
    : routeMode.phase.status === 'idle'
      ? 'Loading route...'
      : routeMode.isDestinationReachable
        ? 'Destination reachable! Click it to finish.'
        : `Navigate to: ${routeMode.endAddress.name}`

  return (
    <section className={s_section}>
      <GMap
        spinUntilReady
        features={[]}
        onMapReady={(payload) => handleMapReady(payload)}
      >
        {isGMapReady && (
          <>
            <div className={s_hud}>
              <div className={s_timer}>{formattedTime}</div>
              <div className={s_prompt}>{promptText}</div>
              {routeMode.isLoading && (
                <div className={s_loading}>Loading roads...</div>
              )}
            </div>
            <div className={s_ui}>
              <GameSettingsButton
                isGameActive={isPlaying}
                resetGameState={handlePlayAgain}
              />
            </div>
            {routeMode.isComplete && (
              <RouteResults
                startPosition={{
                  lat: routeMode.startAddress.lat,
                  lng: routeMode.startAddress.lng,
                }}
                endPosition={{
                  lat: routeMode.endAddress.lat,
                  lng: routeMode.endAddress.lng,
                }}
                playerWaypoints={routeMode.decisions.map((d) => d.position)}
                gameTimeSeconds={Math.floor(elapsedMs / 1000)}
                mapContext={mapContext}
                onPlayAgain={handlePlayAgain}
              />
            )}
          </>
        )}
      </GMap>
    </section>
  )
}

const s_section = 'flex min-h-0 flex-1'
const s_hud =
  'pointer-events-none absolute inset-x-4 top-4 z-10 flex items-center justify-between rounded-2xl px-4 py-3 md:px-16'
const s_timer = 'text-lg font-semibold tabular-nums text-slate-700'
const s_prompt = 'text-lg font-semibold text-slate-900'
const s_loading = 'text-sm text-slate-400'
const s_ui =
  'pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-2'
