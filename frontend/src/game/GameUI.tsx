import type { GameState } from './hooks/useGameState'
import { NameModeInput } from './NameModeInput'
import { GameSettingsButton } from './settings/GameSettingsButton.tsx'

type Props = {
  gameState: GameState
  resetGameState: () => void
}

export const GameUI = ({ gameState, resetGameState }: Props) => {
  const { mode, isGameActive, isComplete } = gameState
  return (
    <>
      <div className={s_ui}>
        <GameSettingsButton
          isGameActive={isGameActive}
          resetGameState={resetGameState}
        />
      </div>
      {mode === 'name' && !isComplete && (
        <div className={s_name_input}>
          <NameModeInput gameState={gameState} />
        </div>
      )}
      {isComplete && (
        <div className={s_overlay}>
          <button
            type='button'
            onClick={resetGameState}
            className={s_play_again}
          >
            Play again
          </button>
        </div>
      )}
    </>
  )
}

const s_ui =
  'pointer-events-auto absolute right-16 bottom-6 z-50 flex items-center gap-2'
const s_name_input =
  'pointer-events-auto absolute inset-x-4 top-4 z-10 flex items-center justify-center px-4 py-3 md:px-16'
const s_overlay =
  'pointer-events-auto absolute inset-0 z-20 flex items-center justify-center'
const s_play_again =
  'rounded-xl bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-purple-700 hover:shadow-xl active:scale-95'
