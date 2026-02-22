import { fetchGoogleMapsApiKey } from '../utils/googleMapsApiKey'
import type {
  RouteResult,
  SelectedIntersection,
  SnappedAddress,
} from '../game/route/types'

type ComputeRoutesResponse = {
  routes: {
    duration: string
    polyline: {
      encodedPolyline: string
    }
  }[]
}

type LatLng = { lat: number; lng: number }

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
const FIELD_MASK = 'routes.duration,routes.polyline.encodedPolyline'

const parseDurationSec = (duration: string): number => {
  // Format: "1234s"
  const match = duration.match(/^(\d+)s$/)
  return match ? Number(match[1]) : 0
}

const computeRoute = async (
  origin: LatLng,
  destination: LatLng,
  intermediates: LatLng[],
  apiKey: string,
): Promise<{ durationSec: number; encodedPolyline: string }> => {
  const body: Record<string, unknown> = {
    origin: {
      location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
    },
    destination: {
      location: {
        latLng: { latitude: destination.lat, longitude: destination.lng },
      },
    },
    travelMode: 'WALK',
    routingPreference: 'ROUTING_PREFERENCE_UNSPECIFIED',
  }

  if (intermediates.length > 0) {
    body.intermediates = intermediates.map((pt) => ({
      location: { latLng: { latitude: pt.lat, longitude: pt.lng } },
    }))
  }

  const response = await fetch(ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Compute Routes failed: ${response.status}`)
  }

  const data = (await response.json()) as ComputeRoutesResponse
  const route = data.routes[0]
  if (!route) {
    throw new Error('Compute Routes returned no routes')
  }

  return {
    durationSec: parseDurationSec(route.duration),
    encodedPolyline: route.polyline.encodedPolyline,
  }
}

export const computeOptimalRoute = async (
  start: SnappedAddress,
  end: SnappedAddress,
): Promise<{ durationSec: number; encodedPolyline: string }> => {
  const apiKey = await fetchGoogleMapsApiKey()
  return computeRoute(
    { lat: start.snappedLat, lng: start.snappedLng },
    { lat: end.snappedLat, lng: end.snappedLng },
    [],
    apiKey,
  )
}

export const computePlayerRoute = async (
  start: SnappedAddress,
  end: SnappedAddress,
  path: SelectedIntersection[],
): Promise<{ durationSec: number; encodedPolyline: string }> => {
  const apiKey = await fetchGoogleMapsApiKey()
  const intermediates = path.map((p) => ({ lat: p.lat, lng: p.lng }))
  return computeRoute(
    { lat: start.snappedLat, lng: start.snappedLng },
    { lat: end.snappedLat, lng: end.snappedLng },
    intermediates,
    apiKey,
  )
}

export const computeRouteResult = async (
  start: SnappedAddress,
  end: SnappedAddress,
  path: SelectedIntersection[],
): Promise<RouteResult> => {
  const [player, optimal] = await Promise.all([
    computePlayerRoute(start, end, path),
    computeOptimalRoute(start, end),
  ])

  const differencePercent =
    optimal.durationSec > 0
      ? Math.round(
          ((player.durationSec - optimal.durationSec) / optimal.durationSec) *
            100,
        )
      : 0

  return {
    playerDurationSec: player.durationSec,
    optimalDurationSec: optimal.durationSec,
    playerPolyline: player.encodedPolyline,
    optimalPolyline: optimal.encodedPolyline,
    differencePercent,
  }
}
