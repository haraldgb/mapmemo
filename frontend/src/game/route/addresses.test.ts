import { createSeededRng } from '../utils'
import { selectRoutePair, OSLO_ROUTE_ADDRESSES } from './addresses'

describe('selectRoutePair', () => {
  it('returns two different addresses', () => {
    const rng = createSeededRng('testtest')
    const { start, end } = selectRoutePair(rng)
    expect(start).not.toBe(end)
    expect(start.name).not.toBe(end.name)
  })

  it('is deterministic for the same seed', () => {
    const pair1 = selectRoutePair(createSeededRng('abcd1234'))
    const pair2 = selectRoutePair(createSeededRng('abcd1234'))
    expect(pair1.start.name).toBe(pair2.start.name)
    expect(pair1.end.name).toBe(pair2.end.name)
  })

  it('produces different pairs for different seeds', () => {
    const pair1 = selectRoutePair(createSeededRng('seedaaaa'))
    const pair2 = selectRoutePair(createSeededRng('seedbbbb'))
    // With 8 addresses, different seeds should usually produce different pairs
    const same =
      pair1.start.name === pair2.start.name &&
      pair1.end.name === pair2.end.name
    expect(same).toBe(false)
  })

  it('never picks the same address for start and end across many seeds', () => {
    for (let i = 0; i < 100; i++) {
      const seed = `test${String(i).padStart(4, '0')}`
      const rng = createSeededRng(seed)
      const { start, end } = selectRoutePair(rng)
      expect(start.name).not.toBe(end.name)
    }
  })

  it('works with a minimal 2-address list', () => {
    const addresses = OSLO_ROUTE_ADDRESSES.slice(0, 2)
    const rng = createSeededRng('min2seed')
    const { start, end } = selectRoutePair(rng, addresses)
    expect(start).not.toBe(end)
    expect(addresses).toContain(start)
    expect(addresses).toContain(end)
  })
})
