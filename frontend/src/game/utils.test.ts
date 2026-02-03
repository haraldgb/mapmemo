import {
  buildAreaOptionsFromGeoJson,
  createSeededRng,
  isValidSeed,
  randomSeed,
  shuffleEntriesWithRng,
  type OsloGeoJson,
} from './utils'
import type { GameEntry } from './types'
import {
  AREA_KEY,
  AREA_NAME_KEY,
  ID_KEY,
  MUNICIPALITY_KEY,
  SUB_AREA_KEY,
  SUB_AREA_NAME_KEY,
} from './consts'

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

  test('buildAreaOptionsFromGeoJson reads feature collection', () => {
    const makeFeature = (
      featureId: string,
      areaId: string,
      areaName: string,
      subAreaId: string,
      subAreaName: string,
    ) => ({
      properties: {
        [ID_KEY]: featureId,
        [MUNICIPALITY_KEY]: '0301',
        [AREA_KEY]: areaId,
        [AREA_NAME_KEY]: areaName,
        [SUB_AREA_KEY]: subAreaId,
        [SUB_AREA_NAME_KEY]: subAreaName,
      },
    })

    const geojson: OsloGeoJson = {
      features: [
        makeFeature('1', '2', 'Zed', '201', 'Zed West'),
        makeFeature('2', '1', 'Alpha', '101', 'Alpha North'),
        makeFeature('3', '2', 'Zed', '202', 'Zed East'),
      ],
    }

    expect(buildAreaOptionsFromGeoJson(geojson)).toEqual([
      { id: '1', name: 'Alpha', count: 1 },
      { id: '2', name: 'Zed', count: 2 },
    ])
  })

  test('buildAreaOptionsFromGeoJson handles single feature', () => {
    const geojson: OsloGeoJson = {
      features: [
        {
          properties: {
            [ID_KEY]: '99',
            [MUNICIPALITY_KEY]: '0301',
            [AREA_KEY]: '99',
            [AREA_NAME_KEY]: 'Gamma',
            [SUB_AREA_KEY]: '9901',
            [SUB_AREA_NAME_KEY]: 'Gamma Center',
          },
        },
      ],
    }

    expect(buildAreaOptionsFromGeoJson(geojson)).toEqual([
      { id: '99', name: 'Gamma', count: 1 },
    ])
  })
})
