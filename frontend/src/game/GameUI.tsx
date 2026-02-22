import type { GameState } from './hooks/useGameState'
import {
  s_overlayGUI_item,
  s_overlayGUI_left,
  s_overlayGUI_right,
  s_overlayGUI_row,
} from './OverlayGuiStyles'
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
      <div className={s_settings}>
        <GameSettingsButton
          isGameActive={isGameActive}
          resetGameState={resetGameState}
        />
      </div>
      <div className={s_overlayGUI_row}>
        {mode === 'name' && !isComplete && (
          <div className={s_overlayGUI_left}>
            <NameModeInput gameState={gameState} />
          </div>
        )}
        {/* the div below takes up corresponding space to right side of GameHUD */}
        <div
          className={`sm:flex-1 ${s_overlayGUI_item} ${s_overlayGUI_right}`}
        />
      </div>
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

const s_settings =
  'pointer-events-auto absolute right-16 bottom-6 z-50 flex items-center gap-2'
const s_overlay =
  'pointer-events-auto absolute inset-0 z-20 flex items-center justify-center'
const s_play_again =
  'rounded-xl bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-purple-700 hover:shadow-xl active:scale-95'
