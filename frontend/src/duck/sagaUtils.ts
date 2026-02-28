import {
  AREA_COUNT_OPTIONS,
  AREA_SUB_MODE_OPTIONS,
  DIFFICULTY_OPTIONS,
  MODE_OPTIONS,
} from '../game/consts'
import type {
  AreaSubMode,
  GameDifficulty,
  GameMode,
  GameSettings,
} from '../game/settings/settingsTypes'
import type { RouteAddress } from '../game/route/types'
import { DEFAULT_ROUTE_ADDRESSES } from '../game/route/routeAddresses'
import { isValidSeed, randomSeed } from '../game/utils'

const SETTINGS_STORAGE_KEY = 'mapmemo.gameSettings'
const isValidMode = (value: unknown): value is GameMode =>
  typeof value === 'string' &&
  MODE_OPTIONS.some((option) => option.value === value)

const isValidDifficulty = (value: unknown): value is GameDifficulty =>
  typeof value === 'string' &&
  DIFFICULTY_OPTIONS.some((option) => option.value === value)

const isValidAreaSubMode = (value: unknown): value is AreaSubMode =>
  typeof value === 'string' &&
  AREA_SUB_MODE_OPTIONS.some((option) => option.value === value)

const isValidAreaCount = (value: unknown): value is number =>
  typeof value === 'number' &&
  AREA_COUNT_OPTIONS.some((option) => option.value === value)

const isRouteAddress = (value: unknown): value is RouteAddress =>
  value !== null &&
  typeof value === 'object' &&
  typeof (value as RouteAddress).label === 'string' &&
  typeof (value as RouteAddress).streetAddress === 'string' &&
  typeof (value as RouteAddress).roadName === 'string' &&
  typeof (value as RouteAddress).lat === 'number' &&
  typeof (value as RouteAddress).lng === 'number'

const normalizeRouteAddresses = (value: unknown): RouteAddress[] => {
  if (!Array.isArray(value)) {
    return DEFAULT_ROUTE_ADDRESSES
  }
  const valid = value.filter(isRouteAddress)
  return valid.length >= 2 ? valid : DEFAULT_ROUTE_ADDRESSES
}

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
  return (
    isValidAreaCount(candidate.areaCount) &&
    isValidMode(candidate.mode) &&
    isValidDifficulty(candidate.difficulty)
  )
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
      mode: candidate.mode ?? 'click',
      difficulty: candidate.difficulty ?? 'easy',
      areaSubMode: isValidAreaSubMode(candidate.areaSubMode)
        ? candidate.areaSubMode
        : 'areaCount',
      areaCount: candidate.areaCount ?? AREA_COUNT_OPTIONS[0]?.value ?? 10,
      selectedAreas: normalizeSelectedAreas(candidate.selectedAreas),
      seed: seedValue,
      routeAddresses: normalizeRouteAddresses(candidate.routeAddresses),
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
      mode: settings.mode,
      difficulty: settings.difficulty,
      areaSubMode: settings.areaSubMode,
      areaCount: settings.areaCount,
      selectedAreas: settings.selectedAreas,
      seed: settings.seed,
      routeAddresses: settings.routeAddresses,
    }
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}
