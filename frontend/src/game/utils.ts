import type { GameEntry, RandomGenerator } from './types'

export const isValidSeed = (seed: string) => seed.length === 8

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

export const randomSeed = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0').slice(0, 8)

export const shuffleEntriesWithRng = (entries: GameEntry[], rng: RandomGenerator) => {
  const result = [...entries]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}
