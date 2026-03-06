import { useEffect, useRef, useState } from 'react'

export type GameTimer = {
  formattedTime: string
}

type Props = {
  isRunning: boolean
  resetKey?: number
}

const TICK_INTERVAL_MS = 100

/** Tracks elapsed game time with 100ms tick resolution. Formatted as `m:ss.t`. */
export const useGameTimer = ({ isRunning, resetKey = 0 }: Props): GameTimer => {
  // useRef needed to track start time across renders without triggering
  // re-renders. Only the interval tick updates displayed state.
  const startTimeRef = useRef<number | null>(null)
  // lastResetKeyRef lets the setInterval callback tag each tick with the
  // resetKey active when the interval was started, so stale ticks from a
  // previous game are ignored without calling setState in the effect body.
  const lastResetKeyRef = useRef(resetKey)
  const [timerState, setTimerState] = useState({
    elapsedMs: 0,
    forResetKey: resetKey,
  })

  useEffect(
    function trackElapsedTime() {
      if (!isRunning) {
        startTimeRef.current = null
        return
      }

      startTimeRef.current = Date.now()
      lastResetKeyRef.current = resetKey
      const interval = setInterval(() => {
        setTimerState({
          elapsedMs: Date.now() - (startTimeRef.current ?? Date.now()),
          forResetKey: lastResetKeyRef.current,
        })
      }, TICK_INTERVAL_MS)

      return () => clearInterval(interval)
    },
    [isRunning, resetKey],
  )

  // When resetKey has advanced (new game, timer not yet started), show 0
  // instead of the frozen final time from the previous game.
  const elapsedMs =
    timerState.forResetKey === resetKey ? timerState.elapsedMs : 0
  return { formattedTime: formatTime(elapsedMs) }
}

const formatTime = (totalMs: number): string => {
  const totalSeconds = Math.floor(totalMs / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  const tenths = Math.floor((totalMs % 1000) / 100)
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`
}
