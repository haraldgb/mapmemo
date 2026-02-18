import type { MutableRefObject } from 'react'
import { ID_KEY } from '../consts'
import { getFeatureProperty } from '../../utils/polygons'
import type { GameEntry, GuessOutcome } from '../types'

type Props = {
  entries: GameEntry[]
  currentIndex: number
  answeredIdsRef: MutableRefObject<Set<string>>
  onGuess: (outcome: GuessOutcome) => void
}

export const useClickModeGuess = ({
  entries,
  currentIndex,
  answeredIdsRef,
  onGuess,
}: Props): ((feature: google.maps.Data.Feature) => void) => {
  const handleFeatureClick = (feature: google.maps.Data.Feature) => {
    const targetEntry = entries[currentIndex]
    if (!targetEntry || currentIndex >= entries.length) {
      return
    }

    const clickedId = getFeatureProperty(feature, ID_KEY)
    if (!clickedId) {
      return
    }
    if (answeredIdsRef.current.has(clickedId)) {
      return
    }

    const isCorrect = clickedId === targetEntry.id
    onGuess({
      isCorrect,
      entryId: targetEntry.id,
      clickedFeature: isCorrect ? null : feature,
    })
  }

  return handleFeatureClick
}
