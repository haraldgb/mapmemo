import { useState } from 'react'
import { GMap } from '../components/GMap'
import { useRouteMode } from './hooks/useRouteMode'
import { useGameTimer } from './hooks/useGameTimer'
import { useRouteMapRendering } from './hooks/useRouteMapRendering'
import { useRouteResult } from './hooks/useRouteResult'
import { RouteResults } from './RouteResults'
import { GameSettingsButton } from './settings/GameSettingsButton'
import type { MapContext } from './types'

const EMPTY_FEATURES: google.maps.Data.Feature[] = []

export const RouteGame = () => {
  const [mapContext, setMapContext] = useState<MapContext>(null)
  const routeState = useRouteMode()

  const isTimerRunning =
    !routeState.isLoading && !routeState.isComplete && mapContext !== null
  const { elapsedMs, formattedTime, resetTimer } = useGameTimer({
    isRunning: isTimerRunning,
  })

  const { resultState, resetResult } = useRouteResult({
    isComplete: routeState.isComplete,
    start: routeState.start,
    end: routeState.end,
    decisions: routeState.decisions,
    gameTimeSeconds: Math.round(elapsedMs / 1000),
  })

  useRouteMapRendering({
    mapContext: mapContext!,
    routeState,
  })

  const handleMapReady = (payload: MapContext) => {
    setMapContext(payload)
  }

  const handlePlayAgain = () => {
    routeState.resetRouteState()
    resetTimer()
    resetResult()
  }

  const promptText = derivePromptText(routeState.phase, routeState.canReachEnd)
  const isGameActive =
    routeState.phase === 'at-start' || routeState.phase === 'at-intersection'

  return (
    <section className={s_section}>
      <GMap
        spinUntilReady
        features={EMPTY_FEATURES}
        onMapReady={handleMapReady}
      >
        {mapContext && (
          <>
            <div className={s_hud}>
              <div className={s_timer}>{formattedTime}</div>
              <div className={s_prompt}>{promptText}</div>
              <div className={s_hud_right} />
            </div>
            <div className={s_ui}>
              <GameSettingsButton
                isGameActive={isGameActive}
                resetGameState={handlePlayAgain}
              />
            </div>
            {routeState.isComplete && (
              <RouteResults
                resultState={resultState}
                formattedGameTime={formattedTime}
                onPlayAgain={handlePlayAgain}
              />
            )}
          </>
        )}
      </GMap>
    </section>
  )
}

const derivePromptText = (phase: string, canReachEnd: boolean): string => {
  switch (phase) {
    case 'loading':
      return 'Loading road data...'
    case 'at-start':
      return 'Click an intersection to start your route'
    case 'at-intersection':
      if (canReachEnd) {
        return 'Click B to finish, or keep navigating'
      }
      return 'Choose your next intersection'
    case 'at-end':
      return 'Route complete!'
    default:
      return ''
  }
}

// --- Styles ---

const s_section = 'flex min-h-0 flex-1'
const s_hud =
  'pointer-events-none absolute inset-x-4 top-4 z-10 grid items-center gap-3 rounded-2xl bg-transparent px-4 py-3 text-center md:grid-cols-[1fr_auto_1fr] md:px-16'
const s_timer = 'text-lg font-semibold tabular-nums text-slate-700 md:text-left'
const s_prompt = 'text-lg font-semibold text-slate-900 md:text-center'
const s_hud_right = 'hidden md:block'
const s_ui =
  'pointer-events-auto absolute right-4 top-4 z-20 flex items-center gap-2'
