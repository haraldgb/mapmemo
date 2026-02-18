import { useEffect, useRef, useState } from 'react'
import type { GameState } from './hooks/useGameState'
import { useInputSuggestions } from './hooks/useInputSuggestions'

type NameModeInputProps = {
  gameState: GameState
}

export const NameModeInput = ({ gameState }: NameModeInputProps) => {
  const { difficulty, registerNameGuess, prevGuess, currentEntry } = gameState
  const [typedValue, setTypedValue] = useState('')
  const [previewValue, setPreviewValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  // useRef: DOM handles needed for imperative focus, scroll, and click-outside detection.
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

  const displayValue = highlightedIndex >= 0 ? previewValue : typedValue

  const filteredSuggestions = useInputSuggestions({
    gameState,
    inputValue: typedValue,
  })

  const shouldShowDropdown = isOpen && filteredSuggestions.length > 0

  const updateHighlight = (newIndex: number) => {
    setHighlightedIndex(newIndex)
    if (newIndex >= 0 && newIndex < filteredSuggestions.length) {
      setPreviewValue(filteredSuggestions[newIndex])
      const item = dropdownRef.current?.children[newIndex] as
        | HTMLElement
        | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }

  const handleSelect = (label: string) => {
    registerNameGuess(label)
    const isCorrect =
      label.trim().toLowerCase() === currentEntry?.label.trim().toLowerCase()
    if (isCorrect) {
      setTypedValue('')
      setPreviewValue('')
    } else {
      setTypedValue(label)
      setPreviewValue('')
    }
    setIsOpen(isCorrect && difficulty === 'beginner')
    setHighlightedIndex(-1)
    inputRef.current?.focus()
    if (!isCorrect) {
      requestAnimationFrame(() => inputRef.current?.select())
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = highlightedIndex >= 0 ? previewValue : typedValue
    if (!value.trim()) {
      return
    }
    handleSelect(value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedValue(e.target.value)
    setPreviewValue('')
    setIsOpen(true)
    setHighlightedIndex(-1)
  }

  // takes care of keyboard navigation inside the input / suggestion dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      if (shouldShowDropdown) {
        handleSelect(filteredSuggestions[0])
      }
      return
    }

    if (!shouldShowDropdown) {
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next =
        highlightedIndex < filteredSuggestions.length - 1
          ? highlightedIndex + 1
          : 0
      updateHighlight(next)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next =
        highlightedIndex > 0
          ? highlightedIndex - 1
          : filteredSuggestions.length - 1
      updateHighlight(next)
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelect(filteredSuggestions[highlightedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
      setPreviewValue('')
    }
  }

  // takes care of focus if user types when input is not focused.
  useEffect(function captureKeysToFocusInput() {
    const handleDocumentKeyDown = (e: KeyboardEvent) => {
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
        setTypedValue((prev) => prev + e.key)
        setIsOpen(true)
        setHighlightedIndex(-1)
        setPreviewValue('')
      }
    }
    document.addEventListener('keydown', handleDocumentKeyDown)
    return () => document.removeEventListener('keydown', handleDocumentKeyDown)
  }, [])

  useEffect(function closeDropdownOnClickOutside() {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
        setHighlightedIndex(-1)
        setPreviewValue('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form
      onSubmit={handleSubmit}
      className={s_name_form}
    >
      <div
        ref={containerRef}
        className={s_autocomplete_container}
      >
        <input
          ref={inputRef}
          type='text'
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (typedValue.length > 0 || difficulty === 'beginner') {
              setIsOpen(true)
            }
          }}
          placeholder='Type area name...'
          autoFocus
          autoComplete='off'
          className={sf_name_input(prevGuess.isCorrect)}
        />
        {shouldShowDropdown && (
          <ul
            ref={dropdownRef}
            className={s_dropdown}
          >
            {filteredSuggestions.map((label, index) => (
              <li
                key={label}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(label)
                }}
                onMouseEnter={() => updateHighlight(index)}
                onMouseLeave={() => {
                  setHighlightedIndex(-1)
                  setPreviewValue('')
                }}
                className={sf_dropdown_item(index === highlightedIndex)}
              >
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  )
}

const s_name_form = 'pointer-events-auto md:text-center'
const s_autocomplete_container = 'relative inline-block w-full max-w-xs'
const sf_name_input = (isCorrectState: boolean) =>
  `w-full rounded-full border-2 bg-white px-4 py-2 text-left text-lg font-semibold shadow-md outline-none ${
    isCorrectState
      ? 'border-slate-300 focus:border-blue-500'
      : 'border-red-400 focus:border-red-500'
  }`
const s_dropdown =
  'absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg'
const sf_dropdown_item = (isHighlighted: boolean) =>
  `cursor-pointer px-4 py-2 text-left text-sm ${
    isHighlighted
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-700 hover:bg-slate-50'
  }`
