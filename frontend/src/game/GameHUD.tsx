import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../store'
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
    registerNameGuess,
    prevGuess,
  } = gameState
  const seed = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.seed,
  )
  const [nameInput, setNameInput] = useState('')

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) {
      return
    }
    registerNameGuess(nameInput)
    if (
      nameInput.trim().toLowerCase() ===
      gameState.currentEntry?.label.trim().toLowerCase()
    ) {
      setNameInput('')
    }
  }

  return (
    <div className={s_ui_container}>
      <div className={s_timer}>{formattedTime}</div>
      {mode === 'name' && !isComplete ? (
        <form
          onSubmit={handleNameSubmit}
          className={s_name_form}
        >
          <input
            type='text'
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder='Type area name...'
            autoFocus
            className={sf_name_input(prevGuess.isCorrect)}
          />
        </form>
      ) : (
        <div className={s_prompt}>{promptText}</div>
      )}
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
  'pointer-events-none absolute inset-x-4 top-4 z-10 grid items-center gap-3 rounded-2xl bg-transparent px-4 py-3 text-center md:grid-cols-[1fr_auto_1fr] md:px-16'
const s_prompt = 'text-lg font-semibold text-slate-900 md:text-center'
const s_name_form = 'pointer-events-auto md:text-center'
const sf_name_input = (isCorrectState: boolean) =>
  `w-full max-w-xs rounded-lg border-2 px-3 py-1.5 text-center text-lg font-semibold outline-none ${
    isCorrectState
      ? 'border-slate-300 focus:border-blue-500'
      : 'border-red-400 focus:border-red-500'
  }`
const s_score_container = 'text-sm font-medium text-slate-500 md:text-right'
const s_seed = 'font-mono tracking-wide text-slate-400'
const s_timer = 'text-lg font-semibold tabular-nums text-slate-700 md:text-left'
