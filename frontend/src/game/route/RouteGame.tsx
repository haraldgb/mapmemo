import { useState } from 'react'
import { GMap } from '../../components/GMap'
import { Spinner } from '../../components/Spinner'
import { GameHUD } from '../GameHUD'
import { GameUI } from '../GameUI'
import { useGameState } from '../hooks/useGameState'
import { useRouteMapRendering } from './useRouteMapRendering'
import { RouteResults } from './RouteResults'

const EMPTY_FEATURES: google.maps.Data.Feature[] = []

export const RouteGame = () => {
  const [isGMapReady, setIsGMapReady] = useState(false)
  const gameState = useGameState({
    features: EMPTY_FEATURES,
    isMapReady: isGMapReady,
  })

  if (gameState.mode !== 'route') {
    throw new Error('RouteGame rendered in non-route mode')
  }

  const { routeGameState } = gameState

  useRouteMapRendering({
    startAddress: routeGameState.startAddress,
    endAddress: routeGameState.endAddress,
    path: routeGameState.path,
    availableIntersections: routeGameState.availableIntersections,
    isReady: routeGameState.isReady,
    canReachDestination: routeGameState.canReachDestination,
    onIntersectionClick: routeGameState.handleIntersectionClick,
    onDestinationClick: routeGameState.handleDestinationClick,
    gameKey: routeGameState.gameKey,
  })

  const handleMapReady = () => {
    setIsGMapReady(true)
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
            <GameHUD gameState={gameState} />
            <GameUI gameState={gameState} />
            {routeGameState.isComplete &&
              routeGameState.startAddress &&
              routeGameState.endAddress && (
                <RouteResults
                  startAddress={routeGameState.startAddress}
                  endAddress={routeGameState.endAddress}
                  path={routeGameState.path}
                  formattedTime={gameState.formattedTime}
                  onPlayAgain={gameState.resetGame}
                />
              )}
            {routeGameState.isLoading &&
              routeGameState.gameKey > 0 &&
              !routeGameState.startAddress && (
                <div className={s_reset_overlay}>
                  <Spinner />
                  Preparing next game...
                </div>
              )}
            {routeGameState.error && (
              <div className={s_error}>{routeGameState.error}</div>
            )}
          </>
        )}
      </GMap>
    </section>
  )
}

const s_section = 'flex min-h-0 flex-1'
const s_reset_overlay =
  'absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 text-sm font-medium text-slate-600'
const s_error =
  'pointer-events-none absolute inset-x-4 bottom-4 z-10 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700'
