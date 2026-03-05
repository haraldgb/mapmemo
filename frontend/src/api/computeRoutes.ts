import type {
  RouteAddress,
  RouteResult,
  SelectedJunction,
} from '../game/route/types'
import { fetchWithSessionRetry } from './utils'

type ComputeRoutesResponse = {
  routes: {
    duration: string
    polyline: {
      encodedPolyline: string
    }
  }[]
}

type LatLng = { lat: number; lng: number }

const parseDurationSec = (duration: string): number => {
  const match = duration.match(/^(\d+)s$/)
  return match ? Number(match[1]) : 0
}

const toLatLngPair = (pt: LatLng) => ({
  latitude: pt.lat,
  longitude: pt.lng,
})

const computeRoute = async (
  origin: LatLng,
  destination: LatLng,
  intermediates: LatLng[],
): Promise<{ durationSec: number; encodedPolyline: string }> => {
  const body = {
    origin: toLatLngPair(origin),
    destination: toLatLngPair(destination),
    ...(intermediates.length > 0 && {
      intermediates: intermediates.map(toLatLngPair),
    }),
  }

  const response = await fetchWithSessionRetry('/api/compute-routes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  start: RouteAddress,
  end: RouteAddress,
): Promise<{ durationSec: number; encodedPolyline: string }> => {
  return computeRoute(
    { lat: start.lat, lng: start.lng },
    { lat: end.lat, lng: end.lng },
    [],
  )
}

export const computePlayerRoute = async (
  start: RouteAddress,
  end: RouteAddress,
  path: SelectedJunction[],
): Promise<{ durationSec: number; encodedPolyline: string }> => {
  const intermediates = path.map((p) => ({ lat: p.lat, lng: p.lng }))
  return computeRoute(
    { lat: start.lat, lng: start.lng },
    { lat: end.lat, lng: end.lng },
    intermediates,
  )
}

export const computeRouteResult = async (
  start: RouteAddress,
  end: RouteAddress,
  path: SelectedJunction[],
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
