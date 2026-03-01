import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

export type AutoCompleteInputHandle = {
  focus: () => void
  open: () => void
  select: () => void
}

type Props = {
  suggestions: string[]
  value: string
  onChange: (value: string) => void
  onSelect: (value: string) => void
  placeholder?: string
  inputClassName?: string
  containerClassName?: string
  disabled?: boolean
  autoFocus?: boolean
  openOnFocus?: boolean
}

export const AutoCompleteInput = forwardRef<AutoCompleteInputHandle, Props>(
  (
    {
      suggestions,
      value,
      onChange,
      onSelect,
      placeholder,
      inputClassName,
      containerClassName,
      disabled,
      autoFocus,
      openOnFocus = false,
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const [previewValue, setPreviewValue] = useState('')

    // useRef: DOM handle for focus/select (imperative handle) and click-outside + scroll-into-view.
    const inputElRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLUListElement>(null)

    useImperativeHandle(ref, () => ({
      focus: () => inputElRef.current?.focus(),
      open: () => setIsOpen(true),
      select: () => inputElRef.current?.select(),
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

    const displayValue = highlightedIndex >= 0 ? previewValue : value
    const shouldShowDropdown = isOpen && suggestions.length > 0

    const updateHighlight = (newIndex: number) => {
      setHighlightedIndex(newIndex)
      if (newIndex >= 0 && newIndex < suggestions.length) {
        setPreviewValue(suggestions[newIndex])
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
      if (e.key === 'Tab') {
        e.preventDefault()
        if (shouldShowDropdown) {
          confirmSelection(suggestions[0])
        }
        return
      }

      if (!shouldShowDropdown) {
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next =
          highlightedIndex < suggestions.length - 1 ? highlightedIndex + 1 : 0
        updateHighlight(next)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next =
          highlightedIndex > 0 ? highlightedIndex - 1 : suggestions.length - 1
        updateHighlight(next)
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault()
        confirmSelection(suggestions[highlightedIndex])
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

    return (
      <div
        ref={containerRef}
        className={containerClassName}
      >
        <input
          ref={inputElRef}
          type='text'
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete='off'
          disabled={disabled}
          className={inputClassName}
        />
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
                title={
                  index === 0 ? 'Press Tab to submit first suggestion' : ''
                }
              >
                <span>{label}</span>
                {index === 0 && <span className={s_tab_hint}>&#x21E5;</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  },
)

AutoCompleteInput.displayName = 'AutoCompleteInput'

const s_dropdown =
  'absolute left-0 right-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg'
const sf_dropdown_item = (isHighlighted: boolean) =>
  `flex cursor-pointer items-center justify-between px-4 py-2 text-left text-sm ${
    isHighlighted
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-700 hover:bg-slate-50'
  }`
const s_tab_hint = 'text-base text-slate-400'
