import { loadGameSettings, saveGameSettings } from './sagaUtils'
import { DEFAULT_ROUTE_ADDRESSES } from '../game/route/routeAddresses'

// sagaUtils uses window.localStorage — mock both in the node jest environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  writable: true,
})
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

const validAddress = {
  label: 'Test street 1',
  streetAddress: 'Test street 1, Oslo',
  roadName: 'Test street',
  lat: 59.9,
  lng: 10.7,
}

const baseSettings = {
  mode: 'click',
  difficulty: 'easy',
  areaSubMode: 'areaCount',
  areaCount: 10,
  selectedAreas: [],
  seed: 'abcd1234',
  routeAddresses: [validAddress, { ...validAddress, label: 'Test street 2' }],
}

describe('loadGameSettings / saveGameSettings round-trip', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('returns null when nothing stored', () => {
    expect(loadGameSettings()).toBeNull()
  })

  test('round-trips valid settings', () => {
    saveGameSettings(baseSettings as Parameters<typeof saveGameSettings>[0])
    const loaded = loadGameSettings()
    expect(loaded).not.toBeNull()
    expect(loaded!.mode).toBe('click')
    expect(loaded!.difficulty).toBe('easy')
    expect(loaded!.seed).toBe('abcd1234')
  })

  test('returns null for corrupted JSON', () => {
    localStorage.setItem('mapmemo.gameSettings', 'not-json{{{')
    expect(loadGameSettings()).toBeNull()
  })

  test('returns null for missing required fields', () => {
    localStorage.setItem(
      'mapmemo.gameSettings',
      JSON.stringify({ mode: 'click' }),
    )
    expect(loadGameSettings()).toBeNull()
  })

  test('rejects unknown mode value', () => {
    localStorage.setItem(
      'mapmemo.gameSettings',
      JSON.stringify({ ...baseSettings, mode: 'flying' }),
    )
    expect(loadGameSettings()).toBeNull()
  })
})

describe('routeAddresses persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('persists and loads valid routeAddresses', () => {
    const settings = {
      ...baseSettings,
      routeAddresses: [
        validAddress,
        { ...validAddress, label: 'B', streetAddress: 'B, Oslo' },
      ],
    }
    saveGameSettings(settings as Parameters<typeof saveGameSettings>[0])
    const loaded = loadGameSettings()
    expect(loaded!.routeAddresses).toHaveLength(2)
    expect(loaded!.routeAddresses[0].label).toBe('Test street 1')
  })

  test('falls back to defaults when routeAddresses has fewer than 2 valid entries', () => {
    const settings = {
      ...baseSettings,
      routeAddresses: [validAddress], // only 1
    }
    saveGameSettings(settings as Parameters<typeof saveGameSettings>[0])
    const loaded = loadGameSettings()
    expect(loaded!.routeAddresses).toEqual(DEFAULT_ROUTE_ADDRESSES)
  })

  test('falls back to defaults when routeAddresses is not an array', () => {
    localStorage.setItem(
      'mapmemo.gameSettings',
      JSON.stringify({ ...baseSettings, routeAddresses: 'bad' }),
    )
    const loaded = loadGameSettings()
    expect(loaded!.routeAddresses).toEqual(DEFAULT_ROUTE_ADDRESSES)
  })

  test('filters out invalid entries within array', () => {
    const settings = {
      ...baseSettings,
      routeAddresses: [
        validAddress,
        { label: 'missing fields' }, // invalid
        { ...validAddress, label: 'C', streetAddress: 'C, Oslo' },
      ],
    }
    saveGameSettings(settings as Parameters<typeof saveGameSettings>[0])
    const loaded = loadGameSettings()
    // 2 valid entries remain, so they are used (not defaults)
    expect(loaded!.routeAddresses).toHaveLength(2)
  })

  test('falls back to defaults when all array entries are invalid', () => {
    localStorage.setItem(
      'mapmemo.gameSettings',
      JSON.stringify({
        ...baseSettings,
        routeAddresses: [{ bad: true }, { also: 'bad' }],
      }),
    )
    const loaded = loadGameSettings()
    expect(loaded!.routeAddresses).toEqual(DEFAULT_ROUTE_ADDRESSES)
  })
})
