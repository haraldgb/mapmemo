import { useEffect, useRef } from 'react'
import { ScoreBar } from './ScoreBar'
import type { GameState } from './hooks/useGameState'
import { useGameTimer } from './hooks/useGameTimer'
import {
  s_overlayGUI_left,
  s_overlayGUI_item,
  s_overlayGUI_right,
  s_overlayGUI_row,
} from './OverlayGuiStyles'

type Props = {
  gameState: GameState
  onComplete?: (formattedTime: string) => void
}

export const GameHUD = ({ gameState, onComplete }: Props) => {
  const { formattedTime } = useGameTimer({
    isRunning: gameState.isTimerRunning,
    resetKey: gameState.timerResetKey,
  })

  // Fire onComplete with the frozen time when timer transitions true → false.
  // formattedTimeRef keeps the latest value without making it an effect dep.
  const formattedTimeRef = useRef(formattedTime)
  const wasRunningRef = useRef(false)
  // Sync ref after every render so captureCompletionTime always reads the
  // latest formattedTime. Declared first so it runs before captureCompletionTime
  // when both fire in the same commit.
  useEffect(function syncFormattedTimeRef() {
    formattedTimeRef.current = formattedTime
  })
  useEffect(
    function captureCompletionTime() {
      if (wasRunningRef.current && !gameState.isTimerRunning) {
        onComplete?.(formattedTimeRef.current)
      }
      wasRunningRef.current = gameState.isTimerRunning
    },
    [gameState.isTimerRunning, onComplete],
  )

  if (gameState.mode === 'route') {
    return (
      <div className={s_overlayGUI_row}>
        <div className={s_timer}>{formattedTime}</div>
      </div>
    )
  }

  const {
    promptPrefixDesktop,
    mode,
    promptText,
    correctCount,
    incorrectCount,
    totalCount,
    isComplete,
    currentEntry,
  } = gameState.areaGameState

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
