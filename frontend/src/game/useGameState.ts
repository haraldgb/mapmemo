import { useRef, useState, type MutableRefObject } from 'react'
import { ID_KEY, SUB_AREA_NAME_KEY } from './consts'
import { getFeatureProperty } from '../utils/polygons'
import { createSeededRng, getAreaId, shuffleEntriesWithRng } from './utils'
import type { GameEntry } from './types'
import { useSeedFromUrl } from './hooks/utilHooks'

type PrevGuess = {
  id: string
  isCorrect: boolean
  consecutiveIncorrectGuesses: number
}
export const INITIAL_PREV_GUESS: PrevGuess = {
  id: '',
  isCorrect: true,
  consecutiveIncorrectGuesses: 0,
}

export type GameState = {
  promptText: string
  correctCount: number
  incorrectCount: number
  scorePercent: number
  isGameActive: boolean
  registerFeatureClick: (feature: google.maps.Data.Feature) => void
  resetGameState: () => void
  prevGuess: PrevGuess
  correctlyGuessedIdsRef: MutableRefObject<Set<string>>
  lateGuessedIdsRef: MutableRefObject<Set<string>>
}

type Props = {
  features: google.maps.Data.Feature[]
}

export const useGameState = ({ features }: Props): GameState => {
  const rngSeed = useSeedFromUrl()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [prevGuess, setPrevGuess] = useState<PrevGuess>(INITIAL_PREV_GUESS)
  const answeredCount = correctCount + incorrectCount

  const createSeededEntries = () => {
    const rawEntries = features
      .map((feature) => {
        const id = getFeatureProperty(feature, ID_KEY)
        const label = getFeatureProperty(feature, SUB_AREA_NAME_KEY)
        const areaId = getAreaId(feature) ?? ''
        return { id, label, feature, areaId }
      })
      .filter((entry): entry is GameEntry => Boolean(entry))
    const rng = createSeededRng(rngSeed)
    const seededEntries = shuffleEntriesWithRng(rawEntries, rng)
    return seededEntries
  }
  const entries = createSeededEntries()

  const scorePercent =
    answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100)
  const total = entries.length
  const currentEntry = entries[currentIndex] ?? null
  const isComplete = total > 0 && currentIndex >= total
  const isGameActive =
    entries.length > 0 && !isComplete && (currentIndex > 0 || answeredCount > 0)

  // refs used in styling callbacks for gmap.
  const correctlyGuessedIdsRef = useRef<Set<string>>(new Set())
  const lateGuessedIdsRef = useRef<Set<string>>(new Set())
  const answeredIdsRef = useRef<Set<string>>(new Set())

  // ------------------------------------------------------------ //

  const resetGameState = () => {
    correctlyGuessedIdsRef.current = new Set()
    answeredIdsRef.current = new Set()
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    correctlyGuessedIdsRef.current = new Set()
    lateGuessedIdsRef.current = new Set()
    setPrevGuess(INITIAL_PREV_GUESS)
  }

  const handleFeatureClick = (feature: google.maps.Data.Feature) => {
    const targetEntry = entries[currentIndex]
    const isGameComplete = currentIndex >= entries.length
    if (!targetEntry || isGameComplete) {
      return
    }
    const clickedId = getFeatureProperty(feature, ID_KEY)
    if (!clickedId) {
      return
    }
    if (answeredIdsRef.current.has(clickedId)) {
      return
    }

    if (clickedId !== targetEntry.id) {
      if (prevGuess.isCorrect) {
        setIncorrectCount((prev) => prev + 1)
      }
      setPrevGuess({
        id: targetEntry.id,
        isCorrect: false,
        consecutiveIncorrectGuesses: prevGuess.consecutiveIncorrectGuesses + 1,
      })
      return
    }

    if (prevGuess.isCorrect) {
      setCorrectCount((prev) => prev + 1)
      correctlyGuessedIdsRef.current.add(clickedId)
    } else {
      lateGuessedIdsRef.current.add(clickedId)
    }
    answeredIdsRef.current.add(clickedId)
    setPrevGuess({
      id: clickedId,
      isCorrect: true,
      consecutiveIncorrectGuesses: 0,
    })

    setCurrentIndex(currentIndex + 1)
    return
  }

  const promptText =
    total === 0
      ? 'Loading areas...'
      : isComplete
        ? 'All areas covered!'
        : `Click area: ${currentEntry?.label ?? ''}`

  return {
    promptText,
    correctCount,
    incorrectCount,
    scorePercent,
    isGameActive,
    registerFeatureClick: handleFeatureClick,
    resetGameState,
    prevGuess,
    correctlyGuessedIdsRef,
    lateGuessedIdsRef,
  }
}
