import { ScoreBar } from './ScoreBar'
import type { GameState } from './hooks/useGameState'

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
    <div className={s_ui_container}>
      <div className={s_left_col}>
        <div className={s_timer}>{formattedTime}</div>
        <div className={s_prompt}>
          {isClickPrompt ? (
            <>
              <span className={s_prompt_prefix_desktop_only}>
                {promptPrefixDesktop}
              </span>
              {promptText}
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
      <div className={s_score_container}>
        <ScoreBar
          correctCount={correctCount}
          incorrectCount={incorrectCount}
          totalCount={totalCount}
        />
      </div>
    </div>
  )
}

const s_ui_container =
  'w-full pointer-events-none absolute top-10 z-10 grid grid-cols-[1fr_auto] items-center gap-x-3 rounded-2xl bg-transparent px-2 sm:px-4 md:px-6 py-3 text-center md:grid-cols-[1fr_auto_1fr] md:gap-3'
const s_score_container =
  'text-sm font-medium text-slate-500 text-right md:text-right'
const s_left_col =
  'flex min-w-0 items-baseline gap-2 md:contents justify-left sm:justify-center'
const s_prompt_prefix_desktop_only = 'hidden md:inline'
const s_prompt =
  'min-w-0 truncate text-lg font-semibold text-slate-900 text-left md:text-center'
const s_timer =
  'flex h-full items-center text-lg font-semibold tabular-nums text-slate-700'
