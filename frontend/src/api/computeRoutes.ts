import { fetchGoogleMapsApiKey } from '../utils/googleMapsApiKey'
import type { LatLng, RouteResult } from '../game/route/types'

const COMPUTE_ROUTES_URL =
  'https://routes.googleapis.com/directions/v2:computeRoutes'

type ComputeRoutesWaypoint = {
  location: {
    latLng: {
      latitude: number
      longitude: number
    }
  }
}

type ComputeRoutesRequest = {
  origin: ComputeRoutesWaypoint
  destination: ComputeRoutesWaypoint
  intermediates?: ComputeRoutesWaypoint[]
  travelMode: 'DRIVE'
  routingPreference: 'TRAFFIC_UNAWARE'
}

type ComputeRoutesResponse = {
  routes: {
    duration: string
    distanceMeters: number
    polyline: {
      encodedPolyline: string
    }
  }[]
}

const toWaypoint = (point: LatLng): ComputeRoutesWaypoint => ({
  location: {
    latLng: {
      latitude: point.lat,
      longitude: point.lng,
    },
  },
})

/** Parse duration string like "1234s" to seconds. */
const parseDurationSeconds = (duration: string): number => {
  const match = duration.match(/^(\d+)s$/)
  if (!match) {
    throw new Error(`Unexpected duration format: ${duration}`)
  }
  return parseInt(match[1], 10)
}

const callComputeRoutes = async (
  apiKey: string,
  request: ComputeRoutesRequest,
): Promise<ComputeRoutesResponse> => {
  const response = await fetch(COMPUTE_ROUTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Compute Routes API error (${response.status}): ${text}`)
  }
  return (await response.json()) as ComputeRoutesResponse
}

/**
 * Compute the optimal route time (A → B direct, no waypoints).
 * Returns duration in seconds.
 */
export const computeOptimalRouteTime = async (
  origin: LatLng,
  destination: LatLng,
): Promise<{ durationSeconds: number; encodedPolyline: string }> => {
  const apiKey = await fetchGoogleMapsApiKey()
  const response = await callComputeRoutes(apiKey, {
    origin: toWaypoint(origin),
    destination: toWaypoint(destination),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_UNAWARE',
  })
  const route = response.routes[0]
  if (!route) {
    throw new Error('No route found for optimal path')
  }
  return {
    durationSeconds: parseDurationSeconds(route.duration),
    encodedPolyline: route.polyline.encodedPolyline,
  }
}

/**
 * Compute the player's route time (A → waypoints → B).
 * Waypoints are the intersections the player selected.
 * Returns duration in seconds.
 */
export const computePlayerRouteTime = async (
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[],
): Promise<{ durationSeconds: number; encodedPolyline: string }> => {
  const apiKey = await fetchGoogleMapsApiKey()
  const response = await callComputeRoutes(apiKey, {
    origin: toWaypoint(origin),
    destination: toWaypoint(destination),
    intermediates: waypoints.map(toWaypoint),
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_UNAWARE',
  })
  const route = response.routes[0]
  if (!route) {
    throw new Error('No route found for player path')
  }
  return {
    durationSeconds: parseDurationSeconds(route.duration),
    encodedPolyline: route.polyline.encodedPolyline,
  }
}

/**
 * Compute both optimal and player route times, returning a RouteResult.
 * Called at game end.
 */
export const computeRouteResult = async (
  origin: LatLng,
  destination: LatLng,
  playerWaypoints: LatLng[],
  gameTimeSeconds: number,
): Promise<
  RouteResult & { optimalPolyline: string; playerPolyline: string }
> => {
  const [optimal, player] = await Promise.all([
    computeOptimalRouteTime(origin, destination),
    computePlayerRouteTime(origin, destination, playerWaypoints),
  ])

  return {
    playerRouteTime: player.durationSeconds,
    optimalTime: optimal.durationSeconds,
    difference: player.durationSeconds - optimal.durationSeconds,
    gameTime: gameTimeSeconds,
    optimalPolyline: optimal.encodedPolyline,
    playerPolyline: player.encodedPolyline,
  }
}
