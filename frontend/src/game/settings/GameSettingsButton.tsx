import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { SettingsCogIcon } from '../../components/icons/SettingsCogIcon'
import { GameSettings } from './GameSettings'
import { useSettingsOpen } from './SettingsOpenContext'

type Props = {
  isGameActive: boolean
  resetGameState: () => void
}

export const GameSettingsButton = ({ isGameActive, resetGameState }: Props) => {
  const { isSettingsOpen, setIsSettingsOpen } = useSettingsOpen()

  useEffect(
    function openOnMountEffect() {
      setIsSettingsOpen(true)
    },
    [setIsSettingsOpen],
  )

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsSettingsOpen(false)
    }
  }

  const handleClick = () => {
    setIsSettingsOpen(!isSettingsOpen)
  }

  return (
    <>
      <button
        type='button'
        className={s_settings_button}
        onClick={handleClick}
        aria-label='Game settings'
      >
        <SettingsCogIcon className={s_settings_icon} />
      </button>
      {/* Portal to body to escape the z-50 stacking context of the button
          container, so header/footer (z-40) remain clickable above the overlay (z-30) */}
      {isSettingsOpen &&
        createPortal(
          <div
            className={s_overlay}
            onMouseDown={handleBackdropClick}
          >
            <GameSettings
              isGameActive={isGameActive}
              onClose={() => setIsSettingsOpen(false)}
              resetGameState={resetGameState}
            />
          </div>,
          document.body,
        )}
    </>
  )
}

const s_overlay =
  'pointer-events-auto fixed inset-0 z-30 flex items-center justify-center'
const s_settings_button =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
const s_settings_icon = 'h-5 w-5'
