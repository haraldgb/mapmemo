import { MODE_OPTIONS } from '../game/consts'
import type { GameSettings } from '../game/settings/settingsTypes'
import {
  loadFromLocalStorage,
  saveToLocalStorage,
} from '../utils/localStorage'

const SETTINGS_STORAGE_KEY = 'mapmemo.gameSettings'
const isValidModeCount = (value: unknown): value is number =>
  typeof value === 'number' &&
  MODE_OPTIONS.some((option) => option.value === value)

const normalizeSelectedAreas = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

const isValidSettings = (value: unknown): value is GameSettings => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<GameSettings>
  return isValidModeCount(candidate.modeCount)
}

export const loadGameSettings = (): GameSettings | null => {
  const stored = loadFromLocalStorage(SETTINGS_STORAGE_KEY, isValidSettings)
  if (!stored) {
    return null
  }
  return {
    modeCount: stored.modeCount ?? MODE_OPTIONS[0]?.value ?? 10,
    selectedAreas: normalizeSelectedAreas(stored.selectedAreas),
  }
}

export const saveGameSettings = (settings: GameSettings) => {
  saveToLocalStorage(SETTINGS_STORAGE_KEY, {
    modeCount: settings.modeCount,
    selectedAreas: settings.selectedAreas,
  })
}
