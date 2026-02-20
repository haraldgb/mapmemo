import type { RouteAddress } from './routeTypes'
import type { RandomGenerator } from './types'

export const ROUTE_MODE_ADDRESSES: RouteAddress[] = [
  { name: 'Storgata 28', roadName: 'Storgata', lat: 59.9155, lng: 10.7527 },
  {
    name: 'Karl Johans gate 1',
    roadName: 'Karl Johans gate',
    lat: 59.9109,
    lng: 10.7491,
  },
  {
    name: 'Bogstadveien 1',
    roadName: 'Bogstadveien',
    lat: 59.9248,
    lng: 10.7233,
  },
  {
    name: 'Kirkeveien 71',
    roadName: 'Kirkeveien',
    lat: 59.9325,
    lng: 10.729,
  },
  {
    name: 'Thereses gate 1',
    roadName: 'Thereses gate',
    lat: 59.9267,
    lng: 10.738,
  },
  {
    name: 'Thorvald Meyers gate 56',
    roadName: 'Thorvald Meyers gate',
    lat: 59.9245,
    lng: 10.758,
  },
  { name: 'Vogts gate 64', roadName: 'Vogts gate', lat: 59.935, lng: 10.768 },
  {
    name: 'Sannergata 2',
    roadName: 'Sannergata',
    lat: 59.92,
    lng: 10.758,
  },
  {
    name: 'Uelands gate 61',
    roadName: 'Uelands gate',
    lat: 59.931,
    lng: 10.746,
  },
  {
    name: 'Maridalsveien 246',
    roadName: 'Maridalsveien',
    lat: 59.954,
    lng: 10.764,
  },
]

/**
 * Pick two distinct addresses from the list using a seeded RNG.
 * Deterministic for a given RNG state — same seed always yields same pair.
 */
export const pickRoutePair = (
  rng: RandomGenerator,
): { start: RouteAddress; end: RouteAddress } => {
  const addresses = ROUTE_MODE_ADDRESSES
  const startIndex = Math.floor(rng() * addresses.length)
  // Pick end index that differs from start
  let endIndex = Math.floor(rng() * (addresses.length - 1))
  if (endIndex >= startIndex) {
    endIndex += 1
  }
  return {
    start: addresses[startIndex]!,
    end: addresses[endIndex]!,
  }
}
