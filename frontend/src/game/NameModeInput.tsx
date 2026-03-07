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
  const [typedValue, setTypedValue] = useState('')

  const inputRef = useRef<AutoCompleteInputHandle>(null)
  useKeepKeyboardOnMapTouch(
    () => inputRef.current?.getInputElement() ?? null,
    // If no overlay open, stop the keyboard from closing when dragging map
    !isSettingsOpen && !isInfoOpen,
  )

  const filteredSuggestions = useInputSuggestions({
    areaGameState,
    inputValue: typedValue,
  })

  const handleSelect = (label: string) => {
    registerNameGuess(label)
    const isCorrect =
      label.trim().toLowerCase() === currentEntry?.label.trim().toLowerCase()
    if (isCorrect) {
      setTypedValue('')
    } else {
      setTypedValue(label)
    }
    inputRef.current?.focus()
    if (!isCorrect) {
      requestAnimationFrame(() => inputRef.current?.select())
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typedValue.trim()) {
      return
    }
    handleSelect(typedValue)
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
          setTypedValue((prev: string) => prev + e.key)
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
        value={typedValue}
        onChange={setTypedValue}
        onSelect={handleSelect}
        placeholder='Type area name...'
        autoFocus
        openOnFocus={difficulty === 'beginner'}
        containerClassName={s_autocomplete_container}
        inputClassName={sf_name_input(prevGuess.isCorrect)}
      />
    </form>
  )
}

const s_name_form = 'pointer-events-auto'
const s_autocomplete_container = `relative w-74 max-w-xs ${s_overlayGUI_item}`
const sf_name_input = (isCorrectState: boolean) =>
  `h-full w-full rounded-full border-2 bg-white px-4 text-left text-lg font-semibold shadow-md outline-none ${
    isCorrectState
      ? 'border-slate-300 focus:border-blue-500'
      : 'border-red-400 focus:border-red-500'
  }`
