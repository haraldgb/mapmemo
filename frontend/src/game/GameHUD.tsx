import { ScoreBar } from './ScoreBar'
import type { GameState } from './hooks/useGameState'

type GameHUDProps = {
  gameState: GameState
  formattedTime: string
}

export const GameHUD = ({ gameState, formattedTime }: GameHUDProps) => {
  const {
    mode,
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
      <div className={s_timer}>{formattedTime}</div>
      <div className={s_prompt}>
        {!showPrompt ? (
          '\u00A0'
        ) : isClickPrompt ? (
          <>
            <span className={s_prompt_prefix_desktop_only}>Click area: </span>
            {currentEntry.label}
          </>
        ) : (
          promptText
        )}
      </div>
      <ScoreBar
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        totalCount={totalCount}
      />
    </div>
  )
}

const s_ui_container =
  'pointer-events-none absolute inset-x-4 top-4 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-transparent px-4 py-3 text-center md:px-16'
const s_prompt = 'text-lg font-semibold text-slate-900 md:text-center'
const s_prompt_prefix_desktop_only = 'hidden md:inline'
const s_timer =
  'flex h-full items-center text-lg font-semibold tabular-nums text-slate-700 md:text-left'
