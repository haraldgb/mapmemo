import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../../store'
import { mapmemoActions } from '../../duck/reducer'
import { MODE_OPTIONS } from '../consts'
import { ConfirmResetPopup } from '../../components/ConfirmResetPopup'
import type { GameSettings as GameSettingsModel } from './settingsTypes'
import { AreaDropdown } from './AreaDropdown'

interface IProps {
  isGameActive: boolean
  onClose: () => void
}

export const GameSettings = ({ isGameActive, onClose }: IProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const currentSettings = useSelector(
    (state: RootState) => state.mapmemo.gameSettings,
  )
  const [draftSettings, setDraftSettings] =
    useState<GameSettingsModel>(currentSettings)
  const areaOptions = useSelector(
    (state: RootState) => state.mapmemo.areaOptions,
  )
  const containerRef = useRef<HTMLDivElement | null>(null)
  const selectedAreaCount = draftSettings.selectedAreas.length
  const isAreaFilterActive = selectedAreaCount > 0
  const areaButtonLabel =
    selectedAreaCount === 0 ? 'All areas' : `${selectedAreaCount} selected`

  const toggleAreaSelection = (areaId: string) => {
    setDraftSettings((prev) => {
      const nextSelected = new Set(prev.selectedAreas)
      if (nextSelected.has(areaId)) {
        nextSelected.delete(areaId)
      } else {
        nextSelected.add(areaId)
      }
      return {
        ...prev,
        selectedAreas: Array.from(nextSelected),
      }
    })
  }

  // prompt user to confirm reset of active game
  const [isConfirming, setIsConfirming] = useState(false)

  const applySettings = () => {
    dispatch(mapmemoActions.setGameSettings(draftSettings))
    onClose()
  }

  const handleApplyClick = () => {
    if (isGameActive) {
      setIsConfirming(true)
      return
    }
    applySettings()
  }

  const handleConfirmApply = () => {
    setIsConfirming(false)
    applySettings()
  }

  const handleConfirmReset = (confirm: boolean) => {
    if (!confirm) {
      setIsConfirming(false)
      return
    }
    handleConfirmApply()
  }

  const handleCancel = () => {
    setIsConfirming(false)
    onClose()
  }

  return (
    <div
      ref={containerRef}
      className={s_container}
    >
      <div className={s_title}>Game settings</div>
      <div className={s_section}>
        <div className={s_label}>Mode</div>
        <div className={sf_option_group(isAreaFilterActive)}>
          {MODE_OPTIONS.map((mode) => {
            const isSelected = draftSettings.modeCount === mode.value
            return (
              <button
                key={mode.value}
                type='button'
                disabled={isAreaFilterActive}
                onClick={() =>
                  setDraftSettings((prev) => ({
                    ...prev,
                    modeCount: mode.value,
                  }))
                }
                className={sf_option_button(isSelected, isAreaFilterActive)}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className={s_section}>
        <div className={s_label}>Area</div>
        <AreaDropdown
          label={areaButtonLabel}
          options={areaOptions}
          selectedIds={draftSettings.selectedAreas}
          onToggleSelection={toggleAreaSelection}
          outsideClickRef={containerRef}
        />
      </div>
      {isConfirming && (
        <ConfirmResetPopup
          onConfirm={handleConfirmReset}
          resetObjectLabel='this game session'
        />
      )}
      <div className={s_actions}>
        <button
          type='button'
          onClick={handleCancel}
          className={s_secondary_button}
        >
          Cancel
        </button>
        <button
          type='button'
          onClick={handleApplyClick}
          className={s_primary_button}
        >
          Apply
        </button>
      </div>
    </div>
  )
}

const s_container =
  'absolute left-1/2 top-full z-30 mt-2 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg'
const s_title = 'text-sm font-semibold text-slate-900'
const s_section = 'mt-3'
const s_label = 'text-xs font-semibold uppercase tracking-wide text-slate-500'
const sf_option_group = (isDisabled: boolean) =>
  `mt-2 flex flex-wrap gap-2 ${isDisabled ? 'opacity-60' : ''}`
const sf_option_button = (isSelected: boolean, isDisabled: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm font-semibold ${
    isSelected
      ? 'border-purple-600 bg-purple-600 text-white'
      : 'border-slate-300 bg-white text-slate-700'
  } ${isDisabled ? 'cursor-not-allowed' : 'hover:border-slate-400'}`
const s_actions = 'mt-4 flex items-center justify-end gap-2'
const s_primary_button =
  'rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700'
const s_secondary_button =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50'
