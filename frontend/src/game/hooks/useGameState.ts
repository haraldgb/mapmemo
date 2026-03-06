import { useState } from 'react'
import { useAreaGameState, type AreaGameState } from './useAreaGameState'
import {
  useRouteGameState,
  type RouteGameState,
} from '../route/useRouteGameState'

export type { AreaGameState } from './useAreaGameState'
export type { RouteGameState } from '../route/useRouteGameState'

type AreaActive = {
  mode: 'click' | 'name'
  areaGameState: AreaGameState
  routeGameState: null
  isTimerRunning: boolean
  timerResetKey: number
  resetGame: () => void
}

type RouteActive = {
  mode: 'route'
  areaGameState: null
  routeGameState: RouteGameState
  isTimerRunning: boolean
  timerResetKey: number
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
 * Provides `isTimerRunning` and `timerResetKey` for the timer owned by GameHUD,
 * and a unified `resetGame` that resets both game state and the timer.
 */
export const useGameState = ({ features, isMapReady }: Props): GameState => {
  const areaState = useAreaGameState({ features })
  const routeState = useRouteGameState()
  const [timerResetKey, setTimerResetKey] = useState(0)

  const isTimerRunning = routeState
    ? routeState.isReady && isMapReady && !routeState.isComplete
    : !!areaState && features.length > 0 && isMapReady && !areaState.isComplete

  if (routeState) {
    const routeReset = routeState.reset
    const resetGame = () => {
      routeReset()
      setTimerResetKey((k) => k + 1)
    }
    return {
      mode: 'route',
      areaGameState: null,
      routeGameState: routeState,
      isTimerRunning,
      timerResetKey,
      resetGame,
    }
  }

  // SAFETY: areaState is non-null when routeState is null (modes are mutually exclusive)
  const area = areaState as AreaGameState
  const areaReset = area.resetGameState
  const resetGame = () => {
    areaReset()
    setTimerResetKey((k) => k + 1)
  }
  return {
    mode: area.mode,
    areaGameState: area,
    routeGameState: null,
    isTimerRunning,
    timerResetKey,
    resetGame,
  }
}
