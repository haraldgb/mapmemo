import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import type { RouteAddress } from '../route/types'
import type { CityInfo } from '../../api/cityApi'
import { AutoCompleteInput } from '../../components/AutoCompleteInput'
import type { AutoCompleteInputHandle } from '../../components/AutoCompleteInput'
import { ChevronIcon } from '../../components/icons/ChevronIcon'
import { TrashIcon } from '../../components/icons/TrashIcon'
import { Spinner } from '../../components/Spinner'
import { usePlaceAutocomplete } from './usePlaceAutocomplete'

const VALIDATING_TOOLTIP = 'Validating road...'

type Props = {
  addresses: RouteAddress[]
  defaultAddresses: RouteAddress[]
  cityInfo: CityInfo | null
  disabled?: boolean
  onAddressesChange: (addresses: RouteAddress[]) => void
  onValidationError: (error: string | null, level: 'warning' | 'error') => void
}

export const RouteAddressInput = ({
  addresses,
  defaultAddresses,
  cityInfo,
  disabled = false,
  onAddressesChange,
  onValidationError,
}: Props) => {
  const placesLibrary = useMapsLibrary('places')
  const inputRef = useRef<AutoCompleteInputHandle>(null)
  const isFirstRender = useRef(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    inputValue,
    suggestions,
    handleInputChange,
    handleSelect,
    validationError,
    validationErrorLevel,
    shake,
    isValidatingRoadName,
    clearValidationError,
  } = usePlaceAutocomplete({
    placesLibrary,
    cityInfo,
    addresses,
    onAddressesChange,
    disabled,
  })

  useEffect(
    function syncValidationError() {
      onValidationError(validationError, validationErrorLevel)
    },
    [validationError, validationErrorLevel, onValidationError],
  )

  useEffect(
    function refocusAfterAddressAdded() {
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      inputRef.current?.focus()
    },
    [addresses.length],
  )

  const handleRemoveAddress = (index: number) => {
    onAddressesChange(addresses.filter((_, i) => i !== index))
    clearValidationError()
  }

  const isDefaultList =
    addresses.length === defaultAddresses.length &&
    addresses.every(
      (a, i) => a.streetAddress === defaultAddresses[i]?.streetAddress,
    )

  const cityDefaultLabel =
    isDefaultList && cityInfo && defaultAddresses.length >= 2
      ? ` (default)`
      : ''

  return (
    <div className={sf_root(disabled)}>
      {disabled ? (
        <div className={s_disabled_placeholder}>Select a city first</div>
      ) : (
        <div title={isValidatingRoadName ? VALIDATING_TOOLTIP : undefined}>
          <AutoCompleteInput
            focusHandleRef={inputRef}
            value={inputValue}
            suggestions={suggestions}
            onChange={handleInputChange}
            onSelect={handleSelect}
            placeholder='Search for a place'
            containerClassName={sf_autocomplete_container(shake)}
            inputClassName={s_autocomplete_input}
            disabled={isValidatingRoadName}
          />
        </div>
      )}

      <div className={s_accordion}>
        <button
          type='button'
          disabled={disabled}
          onClick={() => setIsExpanded((v) => !v)}
          className={sf_toggle(disabled)}
        >
          <span className={s_toggle_label}>
            {addresses.length}{' '}
            {addresses.length === 1 ? 'address' : 'addresses'}
            {cityDefaultLabel}
          </span>
          {isValidatingRoadName ? (
            <span title={VALIDATING_TOOLTIP}>
              <Spinner className={s_inline_spinner} />
            </span>
          ) : (
            <ChevronIcon className={sf_chevron(isExpanded)} />
          )}
        </button>

        {isExpanded && (
          <div className={s_collapsible}>
            <div className={sf_list(isValidatingRoadName)}>
              {addresses.map((address, index) => (
                <div
                  key={`${address.streetAddress}-${index}`}
                  className={s_list_item}
                >
                  <span className={s_list_label}>{address.label}</span>
                  <button
                    type='button'
                    disabled={isValidatingRoadName}
                    onClick={() => handleRemoveAddress(index)}
                    className={s_delete_button}
                    title='Remove address'
                  >
                    <TrashIcon className={s_trash_icon} />
                  </button>
                </div>
              ))}
            </div>
            {!isDefaultList &&
              !isValidatingRoadName &&
              defaultAddresses.length >= 2 && (
                <button
                  type='button'
                  onClick={() => {
                    onAddressesChange(defaultAddresses)
                    clearValidationError()
                  }}
                  className={s_use_defaults}
                >
                  Reset to defaults
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  )
}

const sf_root = (isDisabled: boolean) =>
  `flex flex-col gap-1.5 ${isDisabled ? 'opacity-60' : ''}`
const s_accordion = 'overflow-hidden rounded-md border border-slate-200'
const sf_toggle = (isDisabled: boolean) =>
  `flex w-full items-center justify-between bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors ${isDisabled ? 'cursor-not-allowed' : 'hover:bg-slate-100 hover:text-slate-800'}`
const s_toggle_label = 'select-none'
const sf_chevron = (isOpen: boolean) =>
  `h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`
const s_inline_spinner =
  'h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500'
const sf_autocomplete_container = (isShaking: boolean) =>
  `relative w-full rounded-md border border-slate-300 ${isShaking ? 'animate-shake' : ''}`
const s_autocomplete_input =
  'w-full rounded-md px-3 py-1.5 text-sm outline-none bg-transparent'
const s_disabled_placeholder =
  'w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400'
const s_collapsible = 'border-t border-slate-200 bg-white'
const sf_list = (isValidating: boolean) =>
  `overflow-auto max-h-40 ${isValidating ? 'pointer-events-none opacity-50' : ''}`
const s_list_item =
  'group flex items-center justify-between border-b border-slate-100 px-2.5 py-1.5 last:border-b-0'
const s_list_label = 'truncate text-xs text-slate-700'
const s_trash_icon = 'h-4 w-4'
const s_delete_button =
  'ml-2 flex-shrink-0 cursor-pointer rounded p-1 text-slate-300 transition-colors group-hover:text-slate-400 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50'
const s_use_defaults =
  'w-full border-t border-slate-100 px-2.5 py-1.5 text-left text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700'
