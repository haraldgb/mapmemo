import { useRef, useState, type RefObject } from 'react'
import { useSelector } from 'react-redux'
import { ID_KEY, SUB_AREA_NAME_KEY } from '../consts'
import { getFeatureProperty } from '../../utils/polygons'
import { createSeededRng, getAreaId, shuffleEntriesWithRng } from '../utils'
import type { GameEntry, GuessOutcome } from '../types'
import type { GameDifficulty } from '../settings/settingsTypes'
import type { RootState } from '../../store'

export type PrevGuess = {
  id: string
  isCorrect: boolean
  consecutiveIncorrectGuesses: number
  clickedFeature: google.maps.Data.Feature | null
}
export const INITIAL_PREV_GUESS: PrevGuess = {
  id: '',
  isCorrect: true,
  consecutiveIncorrectGuesses: 0,
  clickedFeature: null,
}

export type AreaGameState = {
  mode: 'click' | 'name'
  difficulty: GameDifficulty
  areaLabels: string[]
  promptPrefixDesktop: string
  promptText: string
  correctCount: number
  incorrectCount: number
  scorePercent: number
  totalCount: number
  isGameActive: boolean
  isComplete: boolean
  currentEntry: GameEntry | null
  registerFeatureClick: (feature: google.maps.Data.Feature) => void
  registerNameGuess: (name: string) => void
  resetGameState: () => void
  prevGuess: PrevGuess
  completedAreaLabels: Set<string>
  correctlyGuessedIdsRef: RefObject<Set<string>>
  lateGuessedIdsRef: RefObject<Set<string>>
}

type Props = {
  features: google.maps.Data.Feature[]
}

/**
 * State machine for area-based game modes (click / name).
 * Manages entries, scoring, guess processing, and per-feature styling refs.
 * Returns `null` when the active mode is `route`.
 */
export const useAreaGameState = ({ features }: Props): AreaGameState | null => {
  const {
    seed: rngSeed,
    mode,
    difficulty,
  } = useSelector((state: RootState) => state.mapmemo.gameSettings)

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
  const areaLabels = entries.map((entry) => entry.label)
  const completedAreaLabels = new Set(
    entries.slice(0, currentIndex).map((entry) => entry.label),
  )

  const scorePercent =
    answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100)
  const total = entries.length
  const currentEntry = entries[currentIndex] ?? null
  const isComplete = total > 0 && currentIndex >= total
  const isGameActive =
    entries.length > 0 && !isComplete && (currentIndex > 0 || answeredCount > 0)

  // Refs used in styling callbacks for gmap.
  const correctlyGuessedIdsRef = useRef<Set<string>>(new Set())
  const lateGuessedIdsRef = useRef<Set<string>>(new Set())
  const answeredIdsRef = useRef<Set<string>>(new Set())

  // ------------------------------------------------------------ //

  const processGuessResult = ({
    isCorrect,
    entryId,
    clickedFeature,
  }: GuessOutcome) => {
    if (!isCorrect) {
      if (prevGuess.isCorrect) {
        setIncorrectCount((prev) => prev + 1)
      }
      setPrevGuess({
        id: entryId,
        isCorrect: false,
        consecutiveIncorrectGuesses: prevGuess.consecutiveIncorrectGuesses + 1,
        clickedFeature,
      })
      return
    }

    if (prevGuess.isCorrect) {
      setCorrectCount((prev) => prev + 1)
      correctlyGuessedIdsRef.current.add(entryId)
    } else {
      lateGuessedIdsRef.current.add(entryId)
    }
    answeredIdsRef.current.add(entryId)
    setPrevGuess({
      id: entryId,
      isCorrect: true,
      consecutiveIncorrectGuesses: 0,
      clickedFeature: null,
    })
    setCurrentIndex(currentIndex + 1)
  }

  const resetGameState = () => {
    correctlyGuessedIdsRef.current = new Set()
    answeredIdsRef.current = new Set()
    lateGuessedIdsRef.current = new Set()
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    setPrevGuess(INITIAL_PREV_GUESS)
  }

  const registerFeatureClick = (feature: google.maps.Data.Feature) => {
    const targetEntry = entries[currentIndex]
    if (!targetEntry || currentIndex >= entries.length) {
      return
    }
    const clickedId = getFeatureProperty(feature, ID_KEY)
    if (!clickedId || answeredIdsRef.current.has(clickedId)) {
      return
    }
    const isCorrect = clickedId === targetEntry.id
    processGuessResult({
      isCorrect,
      entryId: targetEntry.id,
      clickedFeature: isCorrect ? null : feature,
    })
  }

  const registerNameGuess = (name: string) => {
    const targetEntry = entries[currentIndex]
    if (!targetEntry || currentIndex >= entries.length) {
      return
    }
    const isCorrect =
      name.trim().toLowerCase() === targetEntry.label.trim().toLowerCase()
    processGuessResult({
      isCorrect,
      entryId: targetEntry.id,
      clickedFeature: null,
    })
  }

  const promptPrefixDesktop = 'Click area:\u00A0'
  const promptText =
    total === 0
      ? 'Loading areas...'
      : isComplete
        ? 'All areas covered!'
        : mode === 'name'
          ? 'Type the highlighted area name'
          : `${currentEntry?.label ?? ''}`

  // All hooks called above — safe to bail out for route mode.
  if (mode === 'route') {
    return null
  }

  return {
    mode,
    difficulty,
    areaLabels,
    promptPrefixDesktop,
    promptText,
    correctCount,
    incorrectCount,
    scorePercent,
    totalCount: entries.length,
    isGameActive,
    isComplete,
    currentEntry,
    registerFeatureClick,
    registerNameGuess,
    resetGameState,
    prevGuess,
    completedAreaLabels,
    correctlyGuessedIdsRef,
    lateGuessedIdsRef,
  }
}
