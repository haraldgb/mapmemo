import type { RandomGenerator } from '../types'
import type { RouteAddress } from './types'

/**
 * Hardcoded Oslo addresses for route mode v1.
 * Chosen to be spread across the city to avoid trivially short routes.
 */
export const OSLO_ROUTE_ADDRESSES: RouteAddress[] = [
  { name: 'Storgata 1', roadName: 'Storgata', lat: 59.9133, lng: 10.7522 },
  {
    name: 'Kirkeveien 71',
    roadName: 'Kirkeveien',
    lat: 59.9285,
    lng: 10.7214,
  },
  {
    name: 'Grünerløkka 12',
    roadName: 'Thorvald Meyers gate',
    lat: 59.9226,
    lng: 10.7588,
  },
  {
    name: 'Bogstadveien 30',
    roadName: 'Bogstadveien',
    lat: 59.9267,
    lng: 10.7233,
  },
  {
    name: 'Tøyengata 2',
    roadName: 'Tøyengata',
    lat: 59.9124,
    lng: 10.7717,
  },
  {
    name: 'Markveien 56',
    roadName: 'Markveien',
    lat: 59.9241,
    lng: 10.7563,
  },
  {
    name: 'Ullevålsveien 60',
    roadName: 'Ullevålsveien',
    lat: 59.9311,
    lng: 10.7364,
  },
  {
    name: 'Schweigaards gate 15',
    roadName: 'Schweigaards gate',
    lat: 59.9104,
    lng: 10.7614,
  },
]

/**
 * Pick a start/end pair deterministically from the address list using a seeded RNG.
 * Ensures start !== end.
 */
export const selectRoutePair = (
  rng: RandomGenerator,
  addresses: RouteAddress[] = OSLO_ROUTE_ADDRESSES,
): { start: RouteAddress; end: RouteAddress } => {
  const startIndex = Math.floor(rng() * addresses.length)
  // Pick end from remaining addresses to guarantee start !== end
  const endOffset = Math.floor(rng() * (addresses.length - 1))
  const endIndex =
    endOffset >= startIndex ? endOffset + 1 : endOffset

  return {
    start: addresses[startIndex],
    end: addresses[endIndex],
  }
}
