import { useState } from 'react'
import { GMap } from '../../components/GMap'
import { Spinner } from '../../components/Spinner'
import { GameSettingsButton } from '../settings/GameSettingsButton'
import { useGameTimer } from '../hooks/useGameTimer'
import { useRouteMode } from './useRouteMode'
import { useRouteMapRendering } from './useRouteMapRendering'
import { RouteGameHUD } from './RouteGameHUD'
import { RouteResults } from './RouteResults'

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
            <RouteGameHUD formattedTime={formattedTime} />
            <RouteMapInteraction
              key={routeMode.gameKey}
              routeMode={routeMode}
            />
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
            {routeMode.isLoading &&
              routeMode.gameKey > 0 &&
              !routeMode.startAddress && (
                <div className={s_reset_overlay}>
                  <Spinner />
                  Preparing next game...
                </div>
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
  useRouteMapRendering({
    startAddress: routeMode.startAddress,
    endAddress: routeMode.endAddress,
    path: routeMode.path,
    availableIntersections: routeMode.availableIntersections,
    isReady: routeMode.isReady,
    canReachDestination: routeMode.canReachDestination,
    onIntersectionClick: routeMode.handleIntersectionClick,
    onDestinationClick: routeMode.handleDestinationClick,
  })

  return null
}

const s_section = 'flex min-h-0 flex-1'
const s_settings =
  'pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-2'
const s_reset_overlay =
  'absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 text-sm font-medium text-slate-600'
const s_error =
  'pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700'
