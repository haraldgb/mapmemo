import { type MouseEvent } from 'react'
import { useSelector } from 'react-redux'
import { InfoIcon } from '../components/icons/InfoIcon'
import type { RootState } from '../store'
import { AreaGameInfo } from './area/AreaGameInfo'
import { RouteGameInfo } from './route/RouteGameInfo'
import { useSettingsOpen } from './settings/SettingsOpenContext'

type Props = {
  isDisabled?: boolean
}

export const GameInfoButton = ({ isDisabled = false }: Props) => {
  const { isInfoOpen, setIsInfoOpen } = useSettingsOpen()
  const mode = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.mode,
  )

  const disabled = isDisabled

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsInfoOpen(false)
    }
  }

  return (
    <>
      <button
        type='button'
        className={sf_info_button(disabled)}
        onClick={() => setIsInfoOpen(!isInfoOpen)}
        aria-label='Game info'
        disabled={disabled}
      >
        <InfoIcon className={s_info_icon} />
      </button>
      {isInfoOpen && (
        <div
          className={s_overlay}
          onMouseDown={handleBackdropClick}
        >
          {mode === 'route' ? (
            <RouteGameInfo onClose={() => setIsInfoOpen(false)} />
          ) : (
            <AreaGameInfo onClose={() => setIsInfoOpen(false)} />
          )}
        </div>
      )}
    </>
  )
}

const sf_info_button = (disabled: boolean) =>
  `z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-black shadow-sm transition${disabled ? ' pointer-events-none' : ' hover:border-slate-300 hover:bg-slate-50'}`
const s_info_icon = 'h-5 w-5'
const s_overlay =
  'pointer-events-auto fixed inset-0 z-20 flex items-center justify-center'
