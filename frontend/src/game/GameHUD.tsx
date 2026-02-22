import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { ScoreBar } from './ScoreBar'
import type { GameState } from './hooks/useGameState'
import {
  s_overlayGUI_left,
  s_overlayGUI_item,
  s_overlayGUI_right,
  s_overlayGUI_row,
} from './OverlayGuiStyles'

type GameHUDProps = {
  gameState?: GameState
  formattedTime: string
}

export const GameHUD = ({ gameState, formattedTime }: GameHUDProps) => {
  const mode = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.mode,
  )

  if (mode === 'route' || !gameState) {
    return (
      <div className={s_route_container}>
        <div className={s_timer}>{formattedTime}</div>
      </div>
    )
  }

  const {
    promptPrefixDesktop,
    mode: gameMode,
    promptText,
    correctCount,
    incorrectCount,
    totalCount,
    isComplete,
    currentEntry,
  } = gameState

  const showPrompt = gameMode !== 'name' || isComplete
  const isClickPrompt =
    showPrompt && gameMode === 'click' && !isComplete && currentEntry

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

const s_route_container =
  'pointer-events-none absolute inset-x-4 top-4 z-10 px-4 py-3'
const s_prompt = `flex items-center px-4 truncate text-lg font-semibold text-slate-900 ${s_overlayGUI_item}`
const s_prompt_prefix_desktop_only = 'hidden md:inline'
const s_timer = `flex items-center text-lg font-semibold tabular-nums text-slate-700 ${s_overlayGUI_item}`
