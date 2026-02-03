import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { AreaOption } from './settingsTypes'

type IProps = {
  label: string
  options: AreaOption[]
  selectedIds: string[]
  onToggleSelection: (areaId: string) => void
  outsideClickRef: RefObject<HTMLDivElement | null>
}

export const AreaDropdown = ({
  label,
  options,
  selectedIds,
  onToggleSelection,
  outsideClickRef,
}: IProps) => {
  const dropdownRoot = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(
    function handleOutsideClickEffect() {
      if (!isOpen) {
        return
      }
      const handleOutsideClick = (event: MouseEvent) => {
        const target = event.target as Node
        const outsideRoot = outsideClickRef.current
        if (!outsideRoot || !dropdownRoot) {
          return
        }
        if (
          outsideRoot.contains(target) &&
          !dropdownRoot.current?.contains(target)
        ) {
          setIsOpen(false)
        }
      }
      window.addEventListener('mousedown', handleOutsideClick)
      return () => {
        window.removeEventListener('mousedown', handleOutsideClick)
      }
    },
    [isOpen, outsideClickRef],
  )

  return (
    <div
      ref={dropdownRoot}
      className={s_dropdown}
    >
      <button
        type='button'
        onClick={() => setIsOpen((open) => !open)}
        className={s_dropdown_button}
      >
        {label}
      </button>
      {isOpen && (
        <div className={s_dropdown_menu}>
          {options.length === 0 && (
            <div className={s_dropdown_empty}>Loading areas...</div>
          )}
          {options.map((option) => {
            const isChecked = selectedIds.includes(option.id)
            return (
              <label
                key={option.id}
                className={s_checkbox_option}
              >
                <input
                  type='checkbox'
                  checked={isChecked}
                  onChange={() => onToggleSelection(option.id)}
                  className={s_checkbox}
                />
                <span>
                  {option.name} ({option.count})
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s_dropdown = 'relative mt-2'
const s_dropdown_button =
  'flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:border-slate-400'
const s_dropdown_menu =
  'absolute left-0 right-0 z-20 mt-2 max-h-48 overflow-auto rounded-md border border-slate-200 bg-white p-2 shadow-lg'
const s_dropdown_empty = 'px-2 py-1 text-sm text-slate-500'
const s_checkbox_option =
  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm text-slate-700 hover:bg-slate-50'
const s_checkbox = 'h-4 w-4 accent-purple-600'
