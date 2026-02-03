import { useEffect, useRef } from 'react'
import {
  CORRECT_STYLE,
  LATE_STYLE,
  FLASH_STYLE,
  HOVER_STYLE,
  OUTLINE_STYLE,
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
  const flashTimeoutRef = useRef<number | null>(null)

  const getStyleForFeature = (feature: google.maps.Data.Feature) => {
    const id = getFeatureProperty(feature, ID_KEY)
    if (!id) {
      return OUTLINE_STYLE
    }
    if (flashIdRef.current === id) {
      return FLASH_STYLE
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
    [mapContext],
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
        refreshStyles()
        return
      }
      if (!id) {
        return
      }
      flashIdRef.current = id
      refreshStyles()
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
      flashTimeoutRef.current = window.setTimeout(() => {
        flashIdRef.current = null
        refreshStyles()
      }, 650)
    },
    [
      gameState.prevGuess.id,
      gameState.prevGuess.isCorrect,
      gameState.prevGuess.consecutiveIncorrectGuesses,
    ],
  )

  useEffect(function cleanupOnUnmount() {
    return () => {
      if (flashTimeoutRef.current) {
        window.clearTimeout(flashTimeoutRef.current)
      }
    }
  }, [])

  return { registerFeatureHover }
}
