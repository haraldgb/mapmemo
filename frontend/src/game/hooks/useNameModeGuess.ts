import type { GameEntry, GuessOutcome } from '../types'

type Props = {
  entries: GameEntry[]
  currentIndex: number
  onGuess: (outcome: GuessOutcome) => void
}

export const useNameModeGuess = ({
  entries,
  currentIndex,
  onGuess,
}: Props): ((name: string) => void) => {
  const handleNameGuess = (name: string) => {
    const targetEntry = entries[currentIndex]
    if (!targetEntry || currentIndex >= entries.length) {
      return
    }

    const isCorrect =
      name.trim().toLowerCase() === targetEntry.label.trim().toLowerCase()
    onGuess({
      isCorrect,
      entryId: targetEntry.id,
      clickedFeature: null,
    })
  }

  return handleNameGuess
}
