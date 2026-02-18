import type { GameEntry, RandomGenerator } from './types'
import type { AreaOption } from './settings/settingsTypes'
import {
  AREA_KEY,
  AREA_NAME_KEY,
  ID_KEY,
  MUNICIPALITY_KEY,
  SEED_LENGTH,
  SEED_REGEX,
  SUB_AREA_KEY,
  SUB_AREA_NAME_KEY,
} from './consts'

export const isValidSeed = (seed: string): boolean =>
  seed.length === SEED_LENGTH && SEED_REGEX.test(seed)

const hashSeed = (seed: string) => {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export const createSeededRng = (seed: string): RandomGenerator => {
  let state = hashSeed(seed) || 1
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randomSeed = (): string =>
  Math.random()
    .toString(36)
    .slice(2, 2 + SEED_LENGTH)
    .padEnd(SEED_LENGTH, '0')
    .slice(0, SEED_LENGTH)

export const shuffleEntriesWithRng = (
  entries: GameEntry[],
  rng: RandomGenerator,
) => {
  const result = [...entries]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

export const getAreaId = (feature: google.maps.Data.Feature): string | null => {
  const rawArea = feature.getProperty(AREA_KEY)
  if (typeof rawArea === 'number') {
    return String(rawArea)
  }
  if (typeof rawArea === 'string') {
    const trimmed = rawArea.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

export const getAreaName = (
  feature: google.maps.Data.Feature,
): string | null => {
  const rawName = feature.getProperty(AREA_NAME_KEY)
  if (typeof rawName !== 'string') {
    return null
  }
  const trimmed = rawName.trim()
  return trimmed.length > 0 ? trimmed : null
}

export type OsloGeoJson = {
  features: {
    id: number
    properties: {
      [ID_KEY]: number
      [MUNICIPALITY_KEY]: string
      [AREA_KEY]: string
      [AREA_NAME_KEY]: string
      [SUB_AREA_KEY]: string
      [SUB_AREA_NAME_KEY]: string
    }
  }[]
}

export const buildAreaOptionsFromGeoJson = (
  geojson: OsloGeoJson,
): AreaOption[] => {
  const areaSet = geojson.features.reduce(
    (acc, curr) => {
      if (!acc[curr.properties[AREA_KEY]]) {
        acc[curr.properties[AREA_KEY]] = {
          id: curr.properties[AREA_KEY],
          name: curr.properties[AREA_NAME_KEY],
          count: 1,
        }
      } else {
        acc[curr.properties[AREA_KEY]].count += 1
      }
      return acc
    },
    {} as Record<string, { id: string; name: string; count: number }>,
  )
  return Object.values(areaSet)
    .map((area) => ({
      id: area.id,
      name: area.name,
      count: area.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const areAreaOptionsEqual = (
  left: AreaOption[],
  right: AreaOption[],
) => {
  if (left.length !== right.length) {
    return false
  }
  return left.every((option, index) => {
    const other = right[index]
    return option?.id === other?.id && option?.name === other?.name
  })
}
