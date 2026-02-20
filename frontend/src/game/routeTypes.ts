import type { RoadIntersection, RoadInfo } from '../api/roadData'

// --- Address / seed selection ---

export type RouteAddress = {
  name: string
  roadName: string
  lat: number
  lng: number
}

// --- Decision history (undo-ready array design) ---

export type RouteDecision = {
  /** The intersection the player clicked */
  intersection: RoadIntersection
  /** The road the player was on when they made this decision */
  fromRoadName: string
}

// --- Intersection graph (grows as player navigates) ---

/** Client-side cache of fetched road data, keyed by road name */
export type RoadCache = Record<string, RoadInfo>

// --- Game state machine ---

type RouteStateBase = {
  start: RouteAddress
  end: RouteAddress
  decisions: RouteDecision[]
  roadCache: RoadCache
}

export type RouteStateAtStart = RouteStateBase & {
  phase: 'at-start'
  /** The starting road's intersections available to click */
  availableIntersections: RoadIntersection[]
}

export type RouteStateAtIntersection = RouteStateBase & {
  phase: 'at-intersection'
  /** The intersection the player is currently at */
  currentIntersection: RoadIntersection
  /** All reachable intersections from this position */
  availableIntersections: RoadIntersection[]
  /** True if the destination road is reachable from current intersection */
  canReachEnd: boolean
}

export type RouteStateAtEnd = RouteStateBase & {
  phase: 'at-end'
}

export type RouteGameState =
  | RouteStateAtStart
  | RouteStateAtIntersection
  | RouteStateAtEnd

// --- Results ---

export type RouteResult = {
  /** Google Maps driving time for the player's route, in seconds */
  playerRouteTime: number
  /** Google Maps optimal driving time A→B, in seconds */
  optimalRouteTime: number
  /** playerRouteTime - optimalRouteTime, in seconds */
  timeDifference: number
  /** Wall clock time spent playing, in seconds */
  gameTime: number
  /** Encoded polyline for the optimal route (for map overlay) */
  optimalPolyline: string
  /** Encoded polyline for the player's route via waypoints (for map overlay) */
  playerPolyline: string
}
