import type { GameState } from './hooks/useGameState'

type GameHUDProps = {
  gameState: GameState
  formattedTime: string
}

export const GameHUD = ({ gameState, formattedTime }: GameHUDProps) => {
  const {
    mode,
    promptText,
    correctCount: correctAttemptCount,
    incorrectCount: incorrectAttemptCount,
    scorePercent,
    isComplete,
  } = gameState

  const showPrompt = mode !== 'name' || isComplete

  return (
    <div className={s_ui_container}>
      <div className={s_timer}>{formattedTime}</div>
      <div className={s_prompt}>{showPrompt ? promptText : '\u00A0'}</div>
      <div className={s_score_container}>
        <span className='font-semibold text-emerald-600'>
          Correct: {correctAttemptCount}
        </span>
        <span className='mx-2'>-</span>
        <span className='font-semibold text-red-600'>
          Incorrect: {incorrectAttemptCount}
        </span>
        <span className='mx-2'>-</span>
        {scorePercent}%
      </div>
    </div>
  )
}

const s_ui_container =
  'pointer-events-none absolute inset-x-4 top-4 z-10 grid items-center gap-3 rounded-2xl bg-transparent px-4 py-3 text-center md:grid-cols-[1fr_auto_1fr] md:px-16'
const s_prompt = 'text-lg font-semibold text-slate-900 md:text-center'
const s_score_container = 'text-sm font-medium text-slate-500 md:text-right'
const s_timer = 'text-lg font-semibold tabular-nums text-slate-700 md:text-left'
