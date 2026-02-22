import { ScoreBar } from './ScoreBar'
import type { GameState } from './hooks/useGameState'
import {
  s_overlayGUI_left,
  s_overlayGUI_item,
  s_overlayGUI_right,
  s_overlayGUI_row,
} from './OverlayGuiStyles'

type GameHUDProps = {
  gameState: GameState
  formattedTime: string
}

export const GameHUD = ({ gameState, formattedTime }: GameHUDProps) => {
  const {
    mode,
    promptPrefixDesktop,
    promptText,
    correctCount,
    incorrectCount,
    totalCount,
    isComplete,
    currentEntry,
  } = gameState

  const showPrompt = mode !== 'name' || isComplete
  const isClickPrompt =
    showPrompt && mode === 'click' && !isComplete && currentEntry

  return (
    <div className={s_overlayGUI_row}>
      <div className={s_overlayGUI_left}>
        {isClickPrompt && (
          <div className={s_prompt}>
            <span className={s_prompt_prefix_desktop_only}>
              {promptPrefixDesktop}
            </span>
            {promptText}
          </div>
        )}
      </div>
      <div className={s_overlayGUI_right}>
        <ScoreBar
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          totalCount={totalCount}
        />
        <div className={s_timer}>{formattedTime}</div>
      </div>
    </div>
  )
}

const s_prompt = `flex items-center px-4 truncate text-lg font-semibold text-slate-900 ${s_overlayGUI_item}`
const s_prompt_prefix_desktop_only = 'hidden md:inline'
const s_timer = `flex items-center text-lg font-semibold tabular-nums text-slate-700 ${s_overlayGUI_item}`
