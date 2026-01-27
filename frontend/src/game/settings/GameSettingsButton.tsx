import { useEffect, useRef, useState } from 'react'
import { GameSettings } from './GameSettings'

interface IProps {
  isGameActive: boolean
}

export const GameSettingsButton = ({ isGameActive }: IProps) => {
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
      >
        Settings
      </button>
      {isOpen && (
        <GameSettings
          isGameActive={isGameActive}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

const s_container = 'relative inline-flex pointer-events-auto'
const s_settings_button =
  'rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50'
