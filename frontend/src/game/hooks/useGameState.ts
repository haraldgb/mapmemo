import { useAreaGameState, type AreaGameState } from './useAreaGameState'
import {
  useRouteGameState,
  type RouteGameState,
} from '../route/useRouteGameState'
import { useGameTimer } from './useGameTimer'

export type { AreaGameState } from './useAreaGameState'
export type { RouteGameState } from '../route/useRouteGameState'

type AreaActive = {
  mode: 'click' | 'name'
  areaGameState: AreaGameState
  routeGameState: null
  formattedTime: string
  resetGame: () => void
}

type RouteActive = {
  mode: 'route'
  areaGameState: null
  routeGameState: RouteGameState
  formattedTime: string
  resetGame: () => void
}

export type GameState = AreaActive | RouteActive

type Props = {
  features: google.maps.Data.Feature[]
  isMapReady: boolean
}

/**
 * Orchestrates area and route game state behind a discriminated union on `mode`.
 * Checking `mode` exposes the corresponding `areaGameState` or `routeGameState`.
 * Composes the mode-specific hook with `useGameTimer` and provides a unified
 * `resetGame` that resets both state and timer.
 */
export const useGameState = ({ features, isMapReady }: Props): GameState => {
  const areaState = useAreaGameState({ features })
  const routeState = useRouteGameState()

  const isTimerRunning = routeState
    ? routeState.isReady && !routeState.isComplete
    : !!areaState && features.length > 0 && isMapReady && !areaState.isComplete

  const { formattedTime, resetTimer } = useGameTimer({
    isRunning: isTimerRunning,
  })

  if (routeState) {
    const routeReset = routeState.reset
    const resetGame = () => {
      routeReset()
      resetTimer()
    }
    return {
      mode: 'route',
      areaGameState: null,
      routeGameState: routeState,
      formattedTime,
      resetGame,
    }
  }

  // SAFETY: areaState is non-null when routeState is null (modes are mutually exclusive)
  const area = areaState as AreaGameState
  const areaReset = area.resetGameState
  const resetGame = () => {
    areaReset()
    resetTimer()
  }
  return {
    mode: area.mode,
    areaGameState: area,
    routeGameState: null,
    formattedTime,
    resetGame,
  }
}
