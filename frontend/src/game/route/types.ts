export type RouteAddress = {
  name: string
  roadName: string
  lat: number
  lng: number
}

export type LatLng = {
  lat: number
  lng: number
}

/** A single intersection the player selected during navigation. */
export type RouteDecision = {
  intersectionId: number
  position: LatLng
  roadName: string
}

/**
 * Discriminated union for route mode game progression.
 *
 * - idle: game not started
 * - at-start: player is at the starting address, choosing first intersection
 * - at-intersection: player is mid-route, choosing next intersection
 * - at-end: player reached the destination
 */
export type RouteGamePhase =
  | { status: 'idle' }
  | { status: 'at-start'; startAddress: RouteAddress; endAddress: RouteAddress }
  | {
      status: 'at-intersection'
      currentIntersectionId: number
      currentPosition: LatLng
    }
  | { status: 'at-end' }

export type RouteGameState = {
  phase: RouteGamePhase
  startAddress: RouteAddress | null
  endAddress: RouteAddress | null
  /** Ordered list of decisions — supports future undo by popping. */
  decisions: RouteDecision[]
}

export type RouteResult = {
  /** Estimated travel time for the player's route, in seconds. */
  playerRouteTime: number
  /** Estimated travel time for Google Maps' optimal route, in seconds. */
  optimalTime: number
  /** Difference (playerRouteTime - optimalTime), in seconds. */
  difference: number
  /** Wall-clock time the player spent playing, in seconds. */
  gameTime: number
}
