import { useEffect, useRef } from 'react'
import { SettingsCogIcon } from '../../components/icons/SettingsCogIcon'
import { GameSettings } from './GameSettings'
import { useSettingsOpen } from './SettingsOpenContext'

type Props = {
  isGameActive: boolean
  resetGameState: () => void
}

export const GameSettingsButton = ({ isGameActive, resetGameState }: Props) => {
  const { isSettingsOpen, setIsSettingsOpen } = useSettingsOpen()
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(
    function openOnMountEffect() {
      setIsSettingsOpen(true)
    },
    [setIsSettingsOpen],
  )

  useEffect(
    function handleOutsideClickEffect() {
      if (!isSettingsOpen) {
        return
      }
      const handleOutsideClick = (event: MouseEvent) => {
        if (!containerRef.current) {
          return
        }
        if (!containerRef.current.contains(event.target as Node)) {
          setIsSettingsOpen(false)
        }
      }
      window.addEventListener('mousedown', handleOutsideClick)
      return () => {
        window.removeEventListener('mousedown', handleOutsideClick)
      }
    },
    [isSettingsOpen, setIsSettingsOpen],
  )

  return (
    <div
      ref={containerRef}
      className={s_container}
    >
      <button
        type='button'
        className={s_settings_button}
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        aria-label='Game settings'
      >
        <SettingsCogIcon className={s_settings_icon} />
      </button>
      {isSettingsOpen && (
        <GameSettings
          isGameActive={isGameActive}
          onClose={() => setIsSettingsOpen(false)}
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
