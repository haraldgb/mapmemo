import { useGameState, type GameState } from './useGameState'
import { useGameTimer } from './useGameTimer'

export type Game = GameState & {
  formattedTime: string
  resetGame: () => void
}

type Props = {
  features: google.maps.Data.Feature[]
  isMapReady: boolean
}

/**
 * Composes core game logic (state, scoring, guesses) with the game timer.
 * Centralizes reset and timer-running logic so consumers get a single hook.
 */
export const useGame = ({ features, isMapReady }: Props): Game => {
  const gameState = useGameState({ features })

  const isTimerRunning =
    features.length > 0 && isMapReady && !gameState.isComplete
  const { formattedTime, resetTimer } = useGameTimer({
    isRunning: isTimerRunning,
  })

  const resetGame = () => {
    gameState.resetGameState()
    resetTimer()
  }

  return {
    ...gameState,
    formattedTime,
    resetGame,
  }
}
