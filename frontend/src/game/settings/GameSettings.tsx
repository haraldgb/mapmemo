import { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../../store'
import { mapmemoActions } from '../../duck/reducer'
import { MODE_OPTIONS, SEED_LENGTH } from '../consts'
import { ConfirmResetPopup } from '../../components/ConfirmResetPopup'
import type { GameSettings as GameSettingsModel } from './settingsTypes'
import { AreaDropdown } from './AreaDropdown'
import { isValidSeed, randomSeed } from '../utils'

const PRESET_SEEDS = ['dickbutt', 'kumquats', 'oslobest'] as const

interface IProps {
  isGameActive: boolean
  onClose: () => void
  resetGameState: () => void
}

export const GameSettings = ({
  isGameActive,
  onClose,
  resetGameState,
}: IProps) => {
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

  const isSeedValid = isValidSeed(draftSettings.seed)

  const handleSeedChange = (value: string) => {
    const filtered = value.replace(/[^a-z0-9]/gi, '').toLowerCase()
    setDraftSettings((prev) => ({ ...prev, seed: filtered }))
  }

  const handleRandomizeSeed = () => {
    setDraftSettings((prev) => ({ ...prev, seed: randomSeed() }))
  }

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
    resetGameState()
  }

  const handleConfirmApply = () => {
    setIsConfirming(false)
    applySettings()
    resetGameState()
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
        <div className={s_label}>Seed</div>
        <div className={s_seed_row}>
          <input
            type='text'
            value={draftSettings.seed}
            onChange={(e) => handleSeedChange(e.target.value)}
            maxLength={SEED_LENGTH}
            className={sf_seed_input(isSeedValid)}
          />
          <button
            type='button'
            onClick={handleRandomizeSeed}
            className={s_secondary_button}
          >
            Randomize
          </button>
        </div>
        <div className={s_preset_row}>
          {PRESET_SEEDS.map((preset) => (
            <button
              key={preset}
              type='button'
              onClick={() =>
                setDraftSettings((prev) => ({ ...prev, seed: preset }))
              }
              className={sf_preset_button(draftSettings.seed === preset)}
            >
              {preset}
            </button>
          ))}
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
          disabled={!isSeedValid}
          className={sf_primary_button(isSeedValid)}
        >
          Apply
        </button>
      </div>
    </div>
  )
}

const s_container =
  'absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg'
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
const s_seed_row = 'mt-2 flex items-center gap-2'
const s_preset_row = 'mt-1.5 flex flex-wrap gap-1.5'
const sf_preset_button = (isActive: boolean) =>
  `rounded-full border px-2.5 py-0.5 font-mono text-xs ${
    isActive
      ? 'border-purple-600 bg-purple-50 text-purple-700'
      : 'border-slate-200 text-slate-500 hover:border-slate-400'
  }`
const sf_seed_input = (isValid: boolean) =>
  `w-full rounded-md border px-3 py-1.5 font-mono text-sm tracking-widest ${
    isValid
      ? 'border-slate-300 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500'
      : 'border-amber-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500'
  }`
const s_actions = 'mt-4 flex items-center justify-end gap-2'
const sf_primary_button = (isEnabled: boolean) =>
  `rounded-md px-3 py-1.5 text-sm font-semibold text-white ${
    isEnabled
      ? 'bg-purple-600 hover:bg-purple-700'
      : 'cursor-not-allowed bg-purple-300'
  }`
const s_secondary_button =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50'
