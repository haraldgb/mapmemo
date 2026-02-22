import { fetchGoogleMapsApiKey } from '../utils/googleMapsApiKey'
import type { RouteAddress, SnappedAddress } from '../game/route/types'

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
  apiKey: string,
): Promise<{ lat: number; lng: number }> => {
  const url = `https://roads.googleapis.com/v1/nearestRoads?points=${lat},${lng}&key=${apiKey}`
  const response = await fetch(url)
  if (!response.ok) {
    // Fallback to hardcoded coords if Roads API fails
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
): Promise<SnappedAddress> => {
  const apiKey = await fetchGoogleMapsApiKey()
  const snapped = await snapToNearestRoad(address.lat, address.lng, apiKey)

  return {
    ...address,
    snappedLat: snapped.lat,
    snappedLng: snapped.lng,
  }
}
