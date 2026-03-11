import { useEffect, useRef, useState } from 'react'
import { useKeepKeyboardOnMapTouch } from './hooks/useKeepKeyboardOnMapTouch'
import type { AreaGameState } from './hooks/useAreaGameState'
import { s_overlayGUI_item } from './OverlayGuiStyles'
import { useInputSuggestions } from './hooks/useInputSuggestions'
import type { AutoCompleteInputHandle } from '../components/AutoCompleteInput'
import { AutoCompleteInput } from '../components/AutoCompleteInput'
import { useSettingsOpen } from './settings/SettingsOpenContext'

type NameModeInputProps = {
  areaGameState: AreaGameState
}

export const NameModeInput = ({ areaGameState }: NameModeInputProps) => {
  const { difficulty, registerNameGuess, prevGuess, currentEntry } =
    areaGameState
  const { isSettingsOpen, isInfoOpen } = useSettingsOpen()
  const [typedSuffix, setTypedSuffix] = useState('')
  // Track which entry the suffix belongs to — reset when entry changes (avoids effect)
  const [suffixEntryId, setSuffixEntryId] = useState(currentEntry?.id)
  if (suffixEntryId !== currentEntry?.id) {
    setSuffixEntryId(currentEntry?.id)
    setTypedSuffix('')
  }

  const inputRef = useRef<AutoCompleteInputHandle>(null)
  useKeepKeyboardOnMapTouch(
    () => inputRef.current?.getInputElement() ?? null,
    // If no overlay open, stop the keyboard from closing when dragging map
    !isSettingsOpen && !isInfoOpen,
  )

  // Number of revealed letters = consecutive incorrect guesses for this area
  const revealedCount = prevGuess.isCorrect
    ? 0
    : prevGuess.consecutiveIncorrectGuesses
  const revealedPrefix = currentEntry?.label.slice(0, revealedCount) ?? ''
  const fullValue = revealedPrefix + typedSuffix

  const filteredSuggestions = useInputSuggestions({
    areaGameState,
    inputValue: fullValue,
    useStartsWith: revealedCount > 0,
  })

  const handleSelect = (label: string) => {
    registerNameGuess(label)
    setTypedSuffix('')
    inputRef.current?.focus()
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (difficulty === 'hard') {
      handleSelect(fullValue)
    }
    if (filteredSuggestions.length > 0) {
      handleSelect(filteredSuggestions[0])
    } else {
      inputRef.current?.shake()
      inputRef.current?.select()
    }
  }

  // Captures keypresses anywhere on the page and redirects to this input,
  // unless settings or info panel is open.
  useEffect(
    function captureKeysToFocusInput() {
      const handleDocumentKeyDown = (e: KeyboardEvent) => {
        if (isSettingsOpen || isInfoOpen) {
          return
        }
        if (document.activeElement === inputRef.current) {
          return
        }
        if (e.key === 'Tab') {
          e.preventDefault()
          inputRef.current?.focus()
          return
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          inputRef.current?.focus()
          inputRef.current?.open()
          setTypedSuffix((prev: string) => prev + e.key)
        }
      }
      document.addEventListener('keydown', handleDocumentKeyDown)
      return () =>
        document.removeEventListener('keydown', handleDocumentKeyDown)
    },
    [isSettingsOpen, isInfoOpen],
  )

  return (
    <form
      onSubmit={handleFormSubmit}
      className={s_name_form}
    >
      <AutoCompleteInput
        focusHandleRef={inputRef}
        suggestions={filteredSuggestions}
        noSuggestions={difficulty === 'hard'}
        value={typedSuffix}
        onChange={setTypedSuffix}
        onSelect={handleSelect}
        prefix={revealedPrefix}
        placeholder={
          revealedPrefix.length > 0 ? undefined : 'Type area name...'
        }
        autoFocus
        openOnFocus={difficulty === 'beginner' || fullValue.length > 0}
        containerClassName={s_autocomplete_container}
        inputWrapperClassName={sf_name_pill(prevGuess.isCorrect)}
        inputClassName={sf_name_input(revealedPrefix.length > 0)}
        legalValueHints={{
          legal: 'Input matches an area',
          illegal: 'Input does not match any areas',
        }}
      />
    </form>
  )
}

const s_name_form = 'pointer-events-auto'
const s_autocomplete_container = `relative w-74 max-w-xs ${s_overlayGUI_item}`
const sf_name_pill = (isCorrect: boolean) =>
  `flex h-full items-center rounded-full border-2 bg-white px-4 shadow-md ${
    isCorrect
      ? 'border-slate-300 focus-within:border-blue-500'
      : 'border-red-400 focus-within:border-red-500'
  }`
const sf_name_input = (hasPrefix: boolean) =>
  `min-w-0 flex-1 bg-transparent text-left text-lg font-semibold outline-none${hasPrefix ? ' lowercase' : ''}`
