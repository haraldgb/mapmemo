import { MODE_OPTIONS } from '../game/consts'
import type { GameSettings } from '../game/settings/settingsTypes'

const STORAGE_KEY = 'mapmemo.gameSettings'
const isValidModeCount = (value: unknown): value is number =>
  typeof value === 'number' &&
  MODE_OPTIONS.some((option) => option.value === value)

const isValidSettings = (value: unknown): value is GameSettings => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<GameSettings>
  return isValidModeCount(candidate.modeCount)
}

// TODO: move into generic utility that takes isValidCheck, storage key
export const loadGameSettings = (): GameSettings | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    if (!isValidSettings(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

// TODO: same as todo for loadGameSettings
export const saveGameSettings = (settings: GameSettings) => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}
