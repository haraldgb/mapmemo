import { useEffect, useRef, useState } from 'react'

export type GameTimer = {
  elapsedMs: number
  formattedTime: string
  resetTimer: () => void
}

type Props = {
  isRunning: boolean
}

const TICK_INTERVAL_MS = 100

/** Tracks elapsed game time with 100ms tick resolution. Formatted as `m:ss.t`. */
export const useGameTimer = ({ isRunning }: Props): GameTimer => {
  // useRef needed to track start time across renders without triggering
  // re-renders. Only the interval tick updates displayed state.
  const startTimeRef = useRef<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(
    function trackElapsedTime() {
      if (!isRunning) {
        return
      }

      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now()
      }

      const interval = setInterval(() => {
        const elapsed = Date.now() - (startTimeRef.current ?? Date.now())
        setElapsedMs(elapsed)
      }, TICK_INTERVAL_MS)

      return () => clearInterval(interval)
    },
    [isRunning],
  )

  const resetTimer = () => {
    startTimeRef.current = Date.now()
    setElapsedMs(0)
  }

  return {
    elapsedMs,
    formattedTime: formatTime(elapsedMs),
    resetTimer,
  }
}

const formatTime = (totalMs: number): string => {
  const totalSeconds = Math.floor(totalMs / 1000)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  const tenths = Math.floor((totalMs % 1000) / 100)
  return `${mins}:${secs.toString().padStart(2, '0')}.${tenths}`
}
