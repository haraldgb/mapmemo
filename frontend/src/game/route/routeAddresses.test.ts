import {
  selectRoutePair,
  getRoutePair,
  DEFAULT_ROUTE_ADDRESSES,
} from './routeAddresses'
import type { RouteAddress } from './types'

const makeAddress = (label: string): RouteAddress => ({
  label,
  streetAddress: `${label}, Oslo`,
  roadName: label,
  lat: 59.9,
  lng: 10.7,
})

const A = makeAddress('A')
const B = makeAddress('B')
const C = makeAddress('C')
const D = makeAddress('D')

describe('selectRoutePair', () => {
  test('returns two different addresses', () => {
    const rng = jest.fn().mockReturnValueOnce(0).mockReturnValueOnce(0)
    const [start, end] = selectRoutePair([A, B], rng)
    expect(start).not.toBe(end)
  })

  test('throws when fewer than 2 addresses', () => {
    expect(() => selectRoutePair([A], () => 0)).toThrow()
    expect(() => selectRoutePair([], () => 0)).toThrow()
  })

  test('start and end indices are never the same', () => {
    // Run many times with random-ish values to check no duplicates
    for (let i = 0; i < 100; i++) {
      const rng = () => Math.random()
      const [start, end] = selectRoutePair([A, B, C, D], rng)
      expect(start).not.toBe(end)
    }
  })

  test('respects pool boundaries — never picks out-of-range index', () => {
    // rng always returns 0 → start = 0, endIdx before adjustment = 0 → adjusted to 1
    const rng = jest.fn().mockReturnValue(0)
    const [start, end] = selectRoutePair([A, B, C], rng)
    expect([A, B, C]).toContain(start)
    expect([A, B, C]).toContain(end)
    expect(start).not.toBe(end)
  })
})

describe('getRoutePair', () => {
  test('returns deterministic result for same seed', () => {
    const [start1, end1] = getRoutePair('abcd1234', [A, B, C, D])
    const [start2, end2] = getRoutePair('abcd1234', [A, B, C, D])
    expect(start1).toBe(start2)
    expect(end1).toBe(end2)
  })

  test('returns different result for different seeds', () => {
    const pair1 = getRoutePair('abcd1234', [A, B, C, D])
    const pair2 = getRoutePair('zzzzzzzz', [A, B, C, D])
    // Very unlikely to be equal with two different seeds
    const same = pair1[0] === pair2[0] && pair1[1] === pair2[1]
    expect(same).toBe(false)
  })

  test('DEFAULT_ROUTE_ADDRESSES has at least 2 entries', () => {
    expect(DEFAULT_ROUTE_ADDRESSES.length).toBeGreaterThanOrEqual(2)
  })

  test('works with DEFAULT_ROUTE_ADDRESSES', () => {
    const [start, end] = getRoutePair('abcd1234', DEFAULT_ROUTE_ADDRESSES)
    expect(start).not.toBe(end)
    expect(DEFAULT_ROUTE_ADDRESSES).toContain(start)
    expect(DEFAULT_ROUTE_ADDRESSES).toContain(end)
  })
})
