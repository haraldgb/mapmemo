import type { RouteResult } from '../game/routeTypes'
import { fetchGoogleMapsApiKey } from '../utils/googleMapsApiKey'

const ROUTES_API_URL =
  'https://routes.googleapis.com/directions/v2:computeRoutes'

type LatLng = { lat: number; lng: number }

// --- REST API request/response types ---

type RouteWaypoint = {
  location: {
    latLng: { latitude: number; longitude: number }
  }
}

type ComputeRoutesRequest = {
  origin: RouteWaypoint
  destination: RouteWaypoint
  intermediates?: RouteWaypoint[]
  travelMode: 'DRIVE'
  routingPreference: 'TRAFFIC_UNAWARE'
}

type ComputeRoutesResponse = {
  routes?: {
    /** Duration string, e.g. "1234s" */
    duration: string
    distanceMeters: number
    polyline?: {
      encodedPolyline: string
    }
  }[]
}

// --- Helpers ---

const toWaypoint = (point: LatLng): RouteWaypoint => ({
  location: {
    latLng: { latitude: point.lat, longitude: point.lng },
  },
})

/** Parse duration string like "1234s" to seconds */
const parseDuration = (duration: string): number => {
  const match = duration.match(/^(\d+)s$/)
  if (!match?.[1]) {
    throw new Error(`Unexpected duration format: ${duration}`)
  }
  return parseInt(match[1], 10)
}

const FIELD_MASK =
  'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline'

const callComputeRoutes = async (
  request: ComputeRoutesRequest,
  apiKey: string,
): Promise<ComputeRoutesResponse> => {
  const response = await fetch(ROUTES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Compute Routes API error (${response.status}): ${text}`)
  }

  return (await response.json()) as ComputeRoutesResponse
}

// --- Public API ---

/**
 * Compute both optimal and player route times via Google Maps Routes API.
 *
 * @param start - Start point
 * @param end - End point
 * @param waypoints - Player's intermediate intersection points (in order)
 * @param gameTimeSeconds - Wall clock time spent playing
 * @returns RouteResult with optimal, player, and difference times
 */
export const computeRouteResult = async (
  start: LatLng,
  end: LatLng,
  waypoints: LatLng[],
  gameTimeSeconds: number,
): Promise<RouteResult> => {
  const apiKey = await fetchGoogleMapsApiKey()

  const baseRequest = {
    travelMode: 'DRIVE' as const,
    routingPreference: 'TRAFFIC_UNAWARE' as const,
  }

  // Fire both requests in parallel
  const [optimalResponse, playerResponse] = await Promise.all([
    callComputeRoutes(
      {
        ...baseRequest,
        origin: toWaypoint(start),
        destination: toWaypoint(end),
      },
      apiKey,
    ),
    callComputeRoutes(
      {
        ...baseRequest,
        origin: toWaypoint(start),
        destination: toWaypoint(end),
        intermediates: waypoints.map(toWaypoint),
      },
      apiKey,
    ),
  ])

  const optimalRoute = optimalResponse.routes?.[0]
  const playerRoute = playerResponse.routes?.[0]

  if (!optimalRoute?.duration || !playerRoute?.duration) {
    throw new Error('Routes API returned no routes')
  }

  const optimalRouteTime = parseDuration(optimalRoute.duration)
  const playerRouteTime = parseDuration(playerRoute.duration)

  return {
    optimalRouteTime,
    playerRouteTime,
    timeDifference: playerRouteTime - optimalRouteTime,
    gameTime: gameTimeSeconds,
  }
}
