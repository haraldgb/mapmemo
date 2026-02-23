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
}

export const GameUI = ({ gameState }: Props) => {
  const isGameActive =
    gameState.mode === 'route'
      ? gameState.routeGameState.isGameActive
      : gameState.areaGameState.isGameActive

  return (
    <>
      <div className={s_settings}>
        <GameSettingsButton
          isGameActive={isGameActive}
          resetGameState={gameState.resetGame}
        />
      </div>
      {gameState.mode !== 'route' && <AreaGameUI gameState={gameState} />}
    </>
  )
}

/**
 * Area-specific overlay: name-mode input, play-again button.
 * Extracted so TS narrows `gameState` to the area branch in the outer check.
 */
const AreaGameUI = ({
  gameState,
}: {
  gameState: GameState & { mode: 'click' | 'name' }
}) => {
  const { areaGameState } = gameState
  return (
    <>
      <div className={s_overlayGUI_row}>
        {gameState.mode === 'name' && !areaGameState.isComplete && (
          <div className={s_overlayGUI_left}>
            <NameModeInput areaGameState={areaGameState} />
          </div>
        )}
        {/* the div below takes up corresponding space to right side of GameHUD */}
        <div
          className={`sm:flex-1 ${s_overlayGUI_item} ${s_overlayGUI_right}`}
        />
      </div>
      {areaGameState.isComplete && (
        <div className={s_overlay}>
          <button
            type='button'
            onClick={gameState.resetGame}
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
