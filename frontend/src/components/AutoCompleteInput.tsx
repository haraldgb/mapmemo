import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from 'react'

export type AutoCompleteInputHandle = {
  focus: () => void
  open: () => void
  select: () => void
  shake: () => void
  getInputElement: () => HTMLInputElement | null
}

type Props = {
  focusHandleRef?: RefObject<AutoCompleteInputHandle | null> // used to open/select/focus/shake input from outside.
  suggestions: string[]
  /** Hides suggestions and submits are not forced to be in suggestions.*/
  noSuggestions?: boolean
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  inputClassName?: string
  containerClassName?: string
  /** When provided, the input is wrapped in a pill div with this class, and `inputClassName` styles the inner input only. */
  inputWrapperClassName?: string
  /** Bold prefix text rendered before the editable input (inside the pill wrapper). */
  prefix?: string
  disabled?: boolean
  autoFocus?: boolean
  openOnFocus?: boolean
  legalValueHints?: { legal: string; illegal: string }
}

export const AutoCompleteInput = ({
  focusHandleRef,
  suggestions,
  noSuggestions = false,
  value,
  onChange,
  onSelect,
  onBlur,
  placeholder,
  inputClassName,
  containerClassName,
  inputWrapperClassName,
  prefix,
  disabled,
  autoFocus,
  openOnFocus = false,
  legalValueHints,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [previewValue, setPreviewValue] = useState('')
  const [isShaking, setIsShaking] = useState(false)

  // useRef: DOM handle for focus/select (imperative handle) and click-outside + scroll-into-view.
  const inputElRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

  const triggerShake = () => {
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 400)
  }

  useImperativeHandle(focusHandleRef, () => ({
    focus: () => inputElRef.current?.focus(),
    open: () => setIsOpen(true),
    select: () => inputElRef.current?.select(),
    shake: triggerShake,
    getInputElement: () => inputElRef.current,
  }))

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

  // When a prefix is shown as a pill, skip inline preview — the pill already gives context
  const displayValue = highlightedIndex >= 0 ? previewValue : value

  const shouldShowDropdown = !noSuggestions && isOpen && suggestions.length > 0

  const updateHighlight = (newIndex: number) => {
    setHighlightedIndex(newIndex)
    if (newIndex >= 0 && newIndex < suggestions.length) {
      // When a prefix is revealed, only preview the suffix portion in the input
      const fullSuggestion = suggestions[newIndex]
      const preview =
        prefix && fullSuggestion.toLowerCase().startsWith(prefix.toLowerCase())
          ? fullSuggestion.slice(prefix.length)
          : fullSuggestion
      setPreviewValue(preview)
      const item = dropdownRef.current?.children[newIndex] as
        | HTMLElement
        | undefined
      item?.scrollIntoView({ block: 'nearest' })
    }
  }

  const confirmSelection = (selected: string) => {
    onSelect(selected)
    setIsOpen(false)
    setHighlightedIndex(-1)
    setPreviewValue('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
    setHighlightedIndex(-1)
    setPreviewValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // if special behaviour, also include this in handleFormSubmit if within a form.
      if (shouldShowDropdown) {
        e.preventDefault()
        confirmSelection(
          suggestions[highlightedIndex >= 0 ? highlightedIndex : 0],
        )
      } else if (noSuggestions && (prefix + value).trim().length > 0) {
        e.preventDefault()
        confirmSelection(prefix + value)
      } else {
        e.preventDefault()
        triggerShake()
        inputElRef.current?.select()
      }
      return
    }

    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault()
      setIsOpen(true)
    }

    if (!shouldShowDropdown) {
      return
    }

    if (e.key === 'ArrowDown' || (!e.shiftKey && e.key === 'Tab')) {
      e.preventDefault()
      const next =
        highlightedIndex < suggestions.length - 1 ? highlightedIndex + 1 : 0
      updateHighlight(next)
    } else if (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) {
      e.preventDefault()
      const next =
        highlightedIndex > 0 ? highlightedIndex - 1 : suggestions.length - 1
      updateHighlight(next)
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setHighlightedIndex(-1)
      setPreviewValue('')
    }
  }

  const handleFocus = () => {
    if (openOnFocus || value.length > 0) {
      setIsOpen(true)
    }
  }

  const handleBlur = () => {
    setIsOpen(false)
    setHighlightedIndex(-1)
    setPreviewValue('')
    onBlur?.()
  }

  const inputEl = (
    <input
      ref={inputElRef}
      type='text'
      value={displayValue}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      autoFocus={autoFocus}
      autoComplete='off'
      disabled={disabled}
      className={inputClassName}
    />
  )

  return (
    <div
      ref={containerRef}
      className={`${containerClassName ?? ''} ${isShaking ? 'animate-shake' : ''}`}
    >
      {inputWrapperClassName != null ? (
        <div className={inputWrapperClassName}>
          {prefix && <span className={s_revealed_prefix}>{prefix}</span>}
          {inputEl}
          {noSuggestions &&
          legalValueHints &&
          (prefix + value).trim().length > 0 ? (
            suggestions
              .map((suggestion) => suggestion.toLowerCase())
              .includes((prefix + value).toLowerCase()) ? (
              <span
                className={s_legal_value_hint}
                title={legalValueHints.legal}
              >
                &#x2714;
              </span>
            ) : (
              <span
                className={s_illegal_value_hint}
                title={legalValueHints.illegal}
              >
                &#x274C;
              </span>
            )
          ) : null}
        </div>
      ) : (
        inputEl
      )}
      {shouldShowDropdown && (
        <ul
          ref={dropdownRef}
          className={s_dropdown}
        >
          {suggestions.map((label, index) => (
            <li
              key={label}
              onMouseDown={(e) => {
                e.preventDefault()
                confirmSelection(label)
              }}
              onMouseEnter={() => updateHighlight(index)}
              onMouseLeave={() => {
                setHighlightedIndex(-1)
                setPreviewValue('')
              }}
              className={sf_dropdown_item(index === highlightedIndex)}
              title={index === 0 ? 'Press Enter to submit this suggestion' : ''}
            >
              <span>{label}</span>
              {((index === 0 && highlightedIndex === -1) ||
                index === highlightedIndex) && (
                <span className={s_submit_hint}>&#x21B5;</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const s_dropdown =
  'absolute left-0 right-0 z-10 mt-1 max-h-24 sm:max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg'
const sf_dropdown_item = (isHighlighted: boolean) =>
  `flex cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${
    isHighlighted
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-700 hover:bg-slate-50'
  }`
const s_submit_hint = 'text-base text-slate-400'
const s_legal_value_hint = 'text-base text-slate-400 cursor-default'
const s_illegal_value_hint = 'text-base text-slate-400 cursor-default'
const s_revealed_prefix = 'select-none font-bold text-slate-700 shrink-0'
