import { useEffect, useRef, useState } from 'react'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import type { RouteAddress } from '../route/types'
import type { CityInfo } from '../../api/cityApi'
import { ChevronIcon } from '../../components/icons/ChevronIcon'
import { TrashIcon } from '../../components/icons/TrashIcon'
import { usePlaceAutocomplete } from './usePlaceAutocomplete'

type Props = {
  addresses: RouteAddress[]
  defaultAddresses: RouteAddress[]
  cityInfo: CityInfo | null
  onAddressesChange: (addresses: RouteAddress[]) => void
  onValidationError: (error: string | null) => void
}

export const RouteAddressInput = ({
  addresses,
  defaultAddresses,
  cityInfo,
  onAddressesChange,
  onValidationError,
}: Props) => {
  const placesLibrary = useMapsLibrary('places')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const { validationError } = usePlaceAutocomplete({
    containerRef,
    placesLibrary,
    cityInfo,
    addresses,
    onAddressesChange,
  })

  useEffect(
    function syncValidationError() {
      onValidationError(validationError)
    },
    [validationError, onValidationError],
  )

  const isDefaultList =
    addresses.length === defaultAddresses.length &&
    addresses.every(
      (a, i) => a.streetAddress === defaultAddresses[i]?.streetAddress,
    )

  return (
    <div className={s_root}>
      <div
        ref={containerRef}
        className={s_autocomplete_container}
      />

      <div className={s_accordion}>
        <button
          type='button'
          onClick={() => setIsExpanded((v) => !v)}
          className={s_toggle}
        >
          <span className={s_toggle_label}>
            {addresses.length}{' '}
            {addresses.length === 1 ? 'address' : 'addresses'}
          </span>
          <ChevronIcon className={sf_chevron(isExpanded)} />
        </button>

        {isExpanded && (
          <div className={s_collapsible}>
            <div className={s_list}>
              {addresses.map((address, index) => (
                <div
                  key={`${address.streetAddress}-${index}`}
                  className={s_list_item}
                >
                  <span className={s_list_label}>{address.label}</span>
                  <button
                    type='button'
                    onClick={() =>
                      onAddressesChange(addresses.filter((_, i) => i !== index))
                    }
                    className={s_delete_button}
                    title='Remove address'
                  >
                    <TrashIcon className={s_trash_icon} />
                  </button>
                </div>
              ))}
            </div>
            {!isDefaultList && (
              <button
                type='button'
                onClick={() => onAddressesChange(defaultAddresses)}
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

const s_root = 'flex flex-col gap-1.5'
const s_accordion = 'overflow-hidden rounded-md border border-slate-200'
const s_toggle =
  'flex w-full items-center justify-between bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-800'
const s_toggle_label = 'select-none'
const sf_chevron = (isOpen: boolean) =>
  `h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`
const s_autocomplete_container = 'w-full rounded-md border border-slate-300'
const s_collapsible = 'border-t border-slate-200 bg-white'
const s_list = 'overflow-auto max-h-40'
const s_list_item =
  'group flex items-center justify-between border-b border-slate-100 px-2.5 py-1.5 last:border-b-0'
const s_list_label = 'truncate text-xs text-slate-700'
const s_trash_icon = 'h-4 w-4'
const s_delete_button =
  'ml-2 flex-shrink-0 cursor-pointer rounded p-1 text-slate-300 transition-colors group-hover:text-slate-400 hover:bg-red-500 hover:text-white'
const s_use_defaults =
  'w-full border-t border-slate-100 px-2.5 py-1.5 text-left text-xs text-purple-600 hover:bg-purple-50 hover:text-purple-700'
