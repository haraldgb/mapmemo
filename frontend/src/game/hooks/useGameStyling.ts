import { useEffect, useRef } from 'react'
import {
  CORRECT_STYLE,
  LATE_STYLE,
  FLASH_STYLE,
  HOVER_STYLE,
  INCORRECT_FLASH_STYLE,
  OUTLINE_STYLE,
  TARGET_STYLE_DIM,
  TARGET_STYLE_BRIGHT,
  ID_KEY,
} from '../consts'
import { getFeatureProperty } from '../../utils/polygons'
import type { GameState } from './useGameState'
import type { MapContext } from '../types'

type Props = {
  gameState: GameState
  mapContext: MapContext
}

export const useGameStyling = ({ gameState, mapContext }: Props) => {
  const mapRef = useRef<google.maps.Map | null>(null)
  const hoveredIdRef = useRef<string | null>(null)
  const flashIdRef = useRef<string | null>(null)
  const flashIsIncorrect = useRef(false)
  const flashTimeoutRef = useRef<number | null>(null)
  // Toggles between dim/bright for the target area pulse animation.
  const targetPulseBright = useRef(false)
  const pulseIntervalRef = useRef<number | null>(null)

  const getStyleForFeature = (feature: google.maps.Data.Feature) => {
    const id = getFeatureProperty(feature, ID_KEY)
    if (!id) {
      return OUTLINE_STYLE
    }
    if (flashIdRef.current === id) {
      return flashIsIncorrect.current ? INCORRECT_FLASH_STYLE : FLASH_STYLE
    }
    if (
      gameState.mode === 'name' &&
      gameState.currentEntry?.id === id &&
      !gameState.correctlyGuessedIdsRef.current.has(id) &&
      !gameState.lateGuessedIdsRef.current.has(id)
    ) {
      return targetPulseBright.current ? TARGET_STYLE_BRIGHT : TARGET_STYLE_DIM
    }
    if (gameState.correctlyGuessedIdsRef.current.has(id)) {
      return CORRECT_STYLE
    }
    if (gameState.lateGuessedIdsRef.current.has(id)) {
      return LATE_STYLE
    }
    if (hoveredIdRef.current === id) {
      return HOVER_STYLE
    }
    return OUTLINE_STYLE
  }

  const refreshStyles = () => {
    const map = mapRef.current
    if (!map) {
      return
    }
    map.data.setStyle(getStyleForFeature)
  }

  const registerFeatureHover = (
    feature: google.maps.Data.Feature,
    isHovering: boolean,
  ) => {
    const id = getFeatureProperty(feature, ID_KEY)
    if (!id) {
      return
    }
    if (isHovering) {
      hoveredIdRef.current = id
    } else {
      hoveredIdRef.current =
        hoveredIdRef.current === id ? null : hoveredIdRef.current
    }
    refreshStyles()
  }

  useEffect(
    function registerMapContext() {
      mapRef.current = mapContext?.map ?? null
      refreshStyles()
    },
    [mapContext, refreshStyles],
  )

  useEffect(
    function updateFlash() {
      const { id, isCorrect, consecutiveIncorrectGuesses } = gameState.prevGuess
      if (!id && !isCorrect && consecutiveIncorrectGuesses === 0) {
        if (flashTimeoutRef.current) {
          window.clearTimeout(flashTimeoutRef.current)
          flashTimeoutRef.current = null
        }
        flashIdRef.current = null
        flashIsIncorrect.current = false
        hoveredIdRef.current = null
        refreshStyles()
        return
      }
      if (isCorrect) {
        if (flashTimeoutRef.current) {
          window.clearTimeout(flashTimeoutRef.current)
          flashTimeoutRef.current = null
        }
        flashIdRef.current = null
        flashIsIncorrect.current = false
        refreshStyles()
        return
      }
      if (!id) {
        return
      }
      flashIdRef.current = id
      flashIsIncorrect.current = true
      refreshStyles()
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
      flashTimeoutRef.current = window.setTimeout(() => {
        flashIdRef.current = null
        refreshStyles()
      }, 650)
    },
    [gameState.prevGuess, refreshStyles],
  )

  useEffect(
    function pulseTargetArea() {
      if (
        gameState.mode !== 'name' ||
        gameState.isComplete ||
        !gameState.currentEntry
      ) {
        if (pulseIntervalRef.current) {
          window.clearInterval(pulseIntervalRef.current)
          pulseIntervalRef.current = null
        }
        return
      }
      pulseIntervalRef.current = window.setInterval(() => {
        targetPulseBright.current = !targetPulseBright.current
        refreshStyles()
      }, 800)
      return () => {
        if (pulseIntervalRef.current) {
          window.clearInterval(pulseIntervalRef.current)
          pulseIntervalRef.current = null
        }
      }
    },
    [
      gameState.mode,
      gameState.isComplete,
      gameState.currentEntry,
      refreshStyles,
    ],
  )

  useEffect(function cleanupOnUnmount() {
    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
      if (pulseIntervalRef.current) {
        window.clearInterval(pulseIntervalRef.current)
      }
    }
  }, [])

  return { registerFeatureHover }
}
