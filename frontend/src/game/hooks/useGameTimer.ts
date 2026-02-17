import { useEffect, useRef, useState } from 'react'

export type GameTimer = {
  elapsedSeconds: number
  formattedTime: string
  resetTimer: () => void
}

type Props = {
  isRunning: boolean
}

export const useGameTimer = ({ isRunning }: Props): GameTimer => {
  // useRef needed to track start time across renders without triggering
  // re-renders. Only the interval tick updates displayed state.
  const startTimeRef = useRef<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(
    function trackElapsedTime() {
      if (!isRunning) {
        return
      }

      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now()
      }

      const interval = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - (startTimeRef.current ?? Date.now())) / 1000,
        )
        setElapsedSeconds(elapsed)
      }, 1000)

      return () => clearInterval(interval)
    },
    [isRunning],
  )

  const resetTimer = () => {
    startTimeRef.current = null
    setElapsedSeconds(0)
  }

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    resetTimer,
  }
}

const formatTime = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
