import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import type { GameState } from './hooks/useGameState'

type GameHUDProps = {
  gameState: GameState
}

/**
 * Game overlay that displays the game prompt and score
 */
export const GameHUD = ({ gameState }: GameHUDProps) => {
  const {
    promptText,
    correctCount: correctAttemptCount,
    incorrectCount: incorrectAttemptCount,
    scorePercent,
  } = gameState
  const seed = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.seed,
  )

  return (
    <div className={s_ui_container}>
      <div className={s_prompt}>{promptText}</div>
      <div className={s_score_container}>
        <span className='font-semibold text-emerald-600'>
          Correct: {correctAttemptCount}
        </span>
        <span className='mx-2'>-</span>
        <span className='font-semibold text-red-600'>
          Incorrect: {incorrectAttemptCount}
        </span>
        <span className='mx-2'>-</span>
        {scorePercent}%<span className='mx-2'>-</span>
        <span className={s_seed}>Seed: {seed}</span>
      </div>
    </div>
  )
}

const s_ui_container =
  'pointer-events-none absolute inset-x-4 top-4 z-10 grid items-center gap-3 rounded-2xl bg-transparent px-4 py-3 text-center md:grid-cols-[1fr_auto_1fr]'
const s_prompt = 'text-lg font-semibold text-slate-900'
const s_score_container = 'text-sm font-medium text-slate-500 md:text-center'
const s_seed = 'font-mono tracking-wide text-slate-400'
