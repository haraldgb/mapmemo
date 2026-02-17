import { MODE_OPTIONS } from '../game/consts'
import type { GameSettings } from '../game/settings/settingsTypes'
import { isValidSeed, randomSeed } from '../game/utils'

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

// TODO: move into generic utility that takes isValidCheck, storage key
export const loadGameSettings = (): GameSettings | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    if (!isValidSettings(parsed)) {
      return null
    }
    const candidate = parsed as Partial<GameSettings>
    const seedValue =
      typeof candidate.seed === 'string' && isValidSeed(candidate.seed)
        ? candidate.seed
        : randomSeed()
    return {
      modeCount: candidate.modeCount ?? MODE_OPTIONS[0]?.value ?? 10,
      selectedAreas: normalizeSelectedAreas(candidate.selectedAreas),
      seed: seedValue,
    }
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
    const payload = {
      modeCount: settings.modeCount,
      selectedAreas: settings.selectedAreas,
      seed: settings.seed,
    }
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}
