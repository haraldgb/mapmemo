import { createSeededRng } from '../utils'
import type { RouteAddress } from './types'

export const DEFAULT_ROUTE_ADDRESSES: RouteAddress[] = [
  {
    label: 'Jacob Aalls gate 32',
    streetAddress: 'Jacob Aalls gate 32, Oslo',
    roadName: 'Jacob Aalls gate',
    lat: 59.9295,
    lng: 10.719,
  },
  {
    label: 'Thereses gate 33B',
    streetAddress: 'Thereses gate 33B, Oslo',
    roadName: 'Thereses gate',
    lat: 59.9278,
    lng: 10.7318,
  },
]

export const selectRoutePair = (
  addresses: RouteAddress[],
  rng: () => number,
): [RouteAddress, RouteAddress] => {
  if (addresses.length < 2) {
    throw new Error('Need at least 2 addresses for a route pair')
  }
  const startIdx = Math.floor(rng() * addresses.length)
  let endIdx = Math.floor(rng() * (addresses.length - 1))
  if (endIdx >= startIdx) {
    endIdx += 1
  }
  return [addresses[startIdx], addresses[endIdx]]
}

export const getRoutePair = (
  seed: string,
  addresses: RouteAddress[],
): [RouteAddress, RouteAddress] => {
  const rng = createSeededRng(seed)
  return selectRoutePair(addresses, rng)
}
