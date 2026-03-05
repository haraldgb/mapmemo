import type { RouteAddress } from '../game/route/types'
import { fetchWithSessionRetry } from './utils'

type SnapToRoadsResponse = {
  snappedPoints?: {
    location: {
      latitude: number
      longitude: number
    }
    placeId: string
  }[]
}

const snapToNearestRoad = async (
  lat: number,
  lng: number,
): Promise<{ lat: number; lng: number }> => {
  const response = await fetchWithSessionRetry('/api/snap-to-roads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng }),
  })
  if (!response.ok) {
    return { lat, lng }
  }
  const data = (await response.json()) as SnapToRoadsResponse
  if (!data.snappedPoints?.[0]) {
    return { lat, lng }
  }
  const point = data.snappedPoints[0].location
  return { lat: point.latitude, lng: point.longitude }
}

export const resolveAddress = async (
  address: RouteAddress,
): Promise<RouteAddress> => {
  const snapped = await snapToNearestRoad(address.lat, address.lng)

  return {
    ...address,
    lat: snapped.lat,
    lng: snapped.lng,
  }
}
