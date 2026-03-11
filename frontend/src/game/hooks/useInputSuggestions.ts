import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import type { AreaGameState } from './useAreaGameState'

type UseInputSuggestionsProps = {
  areaGameState: AreaGameState
  inputValue: string
  /**Default is includes */
  useStartsWith?: boolean
}

/**
 * For name mode, returns a list of area label suggestions based on the current input value + game state and difficulty.
 */
export const useInputSuggestions = ({
  areaGameState,
  inputValue,
  useStartsWith = false,
}: UseInputSuggestionsProps) => {
  const { difficulty, areaLabels, completedAreaLabels } = areaGameState
  const allSubAreaNames = useSelector(
    (state: RootState) => state.mapmemo.allSubAreaNames,
  )

  const sorted = [...areaLabels].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  )
  const suggestionPool =
    difficulty === 'beginner' || difficulty === 'easy'
      ? difficulty === 'beginner'
        ? sorted.filter((label) => !completedAreaLabels.has(label))
        : sorted
      : allSubAreaNames

  const filteredSuggestions =
    difficulty === 'beginner' && inputValue.length === 0
      ? suggestionPool
      : inputValue.length > 0
        ? suggestionPool.filter((label) =>
            useStartsWith
              ? label.toLowerCase().startsWith(inputValue.toLowerCase())
              : label.toLowerCase().includes(inputValue.toLowerCase()),
          )
        : []

  return filteredSuggestions
}
