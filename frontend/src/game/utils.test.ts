import {
  createSeededRng,
  isValidSeed,
  randomSeed,
  shuffleEntriesWithRng,
} from './utils'
import type { GameEntry } from './types'

const makeEntry = (id: string): GameEntry => ({
  id,
  feature: {} as google.maps.Data.Feature,
  areaId: '0',
})

describe('game utils', () => {
  test('isValidSeed checks length', () => {
    expect(isValidSeed('abcdefgh')).toBe(true)
    expect(isValidSeed('short')).toBe(false)
    expect(isValidSeed('toolonggg')).toBe(false)
  })

  test('randomSeed returns 8-character base36 string', () => {
    const seed = randomSeed()
    expect(seed).toHaveLength(8)
    expect(seed).toMatch(/^[a-z0-9]{8}$/)
    expect(isValidSeed(seed)).toBe(true)
  })

  test('createSeededRng produces deterministic sequence', () => {
    const rngA = createSeededRng('abcd1234')
    const rngB = createSeededRng('abcd1234')
    const rngC = createSeededRng('zzzzzzzz')

    const seqA = [rngA(), rngA(), rngA()]
    const seqB = [rngB(), rngB(), rngB()]
    const seqC = [rngC(), rngC(), rngC()]

    expect(seqA).toEqual(seqB)
    expect(seqA).not.toEqual(seqC)
  })

  test('shuffleEntriesWithRng uses provided RNG', () => {
    const entries = [
      makeEntry('a'),
      makeEntry('b'),
      makeEntry('c'),
      makeEntry('d'),
    ]
    const rng = () => 0

    const shuffled = shuffleEntriesWithRng(entries, rng)

    expect(shuffled.map((entry) => entry.id)).toEqual(['b', 'c', 'd', 'a'])
    expect(entries.map((entry) => entry.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})
