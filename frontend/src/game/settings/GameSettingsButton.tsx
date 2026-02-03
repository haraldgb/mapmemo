import { useEffect, useRef, useState } from 'react'
import { SettingsCogIcon } from '../../components/icons/SettingsCogIcon'
import { GameSettings } from './GameSettings'

interface IProps {
  isGameActive: boolean
  resetGameState: () => void
}

export const GameSettingsButton = ({
  isGameActive,
  resetGameState,
}: IProps) => {
  const [isOpen, setIsOpen] = useState(true)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(
    function handleOutsideClickEffect() {
      if (!isOpen) {
        return
      }
      const handleOutsideClick = (event: MouseEvent) => {
        if (!containerRef.current) {
          return
        }
        if (!containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      window.addEventListener('mousedown', handleOutsideClick)
      return () => {
        window.removeEventListener('mousedown', handleOutsideClick)
      }
    },
    [isOpen],
  )

  return (
    <div
      ref={containerRef}
      className={s_container}
    >
      <button
        type='button'
        className={s_settings_button}
        onClick={() => setIsOpen((open) => !open)}
        aria-label='Game settings'
      >
        <SettingsCogIcon className={s_settings_icon} />
      </button>
      {isOpen && (
        <GameSettings
          isGameActive={isGameActive}
          onClose={() => setIsOpen(false)}
          resetGameState={resetGameState}
        />
      )}
    </div>
  )
}

const s_container = 'relative inline-flex pointer-events-auto'
const s_settings_button =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
const s_settings_icon = 'h-5 w-5'
