import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import type { RoadIntersection } from '../../api/roadData'
import type { RouteAddress, RouteDecision, RoadCache } from '../routeTypes'
import { createSeededRng } from '../utils'
import { pickRoutePair } from '../routeAddresses'
import { useRoadCache } from './useRoadCache'

// --- Pure helpers ---

const POINT_EPSILON = 0.00005

const isSamePoint = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): boolean =>
  Math.abs(a.lat - b.lat) < POINT_EPSILON &&
  Math.abs(a.lng - b.lng) < POINT_EPSILON

/**
 * Check if candidate is "ahead" of current when traveling from previous.
 * Uses dot product of travel direction and candidate direction from current.
 * If previous === current (zero direction), everything is considered ahead.
 */
const isAhead = (
  prev: { lat: number; lng: number },
  current: { lat: number; lng: number },
  candidate: { lat: number; lng: number },
): boolean => {
  const dx = current.lng - prev.lng
  const dy = current.lat - prev.lat
  if (Math.abs(dx) < POINT_EPSILON && Math.abs(dy) < POINT_EPSILON) {
    return true
  }
  const cx = candidate.lng - current.lng
  const cy = candidate.lat - current.lat
  return dx * cx + dy * cy > 0
}

/** A clickable intersection annotated with the road it belongs to */
export type SelectableIntersection = {
  intersection: RoadIntersection
  /** The road this intersection is listed on (the road the player would travel along) */
  onRoadName: string
}

/** Get all road names that pass through a point, based on the arrival road's intersections */
const getRoadsAtPoint = (
  point: { lat: number; lng: number },
  arrivalRoadName: string,
  roadCache: RoadCache,
): string[] => {
  const roads = new Set<string>([arrivalRoadName])
  const arrivalRoad = roadCache[arrivalRoadName]
  if (arrivalRoad) {
    for (const ix of arrivalRoad.intersections) {
      if (isSamePoint(ix, point)) {
        roads.add(ix.otherRoadName)
      }
    }
  }
  return [...roads]
}

/**
 * Compute all selectable intersections from the current position.
 * - On the arrival road: only intersections ahead (direction-filtered)
 * - On cross roads: all intersections (player can go either direction on a turn)
 */
const computeAvailableIntersections = (
  currentPoint: { lat: number; lng: number },
  arrivalRoadName: string,
  previousPoint: { lat: number; lng: number },
  roadCache: RoadCache,
): SelectableIntersection[] => {
  const result: SelectableIntersection[] = []
  const roads = getRoadsAtPoint(currentPoint, arrivalRoadName, roadCache)

  for (const roadName of roads) {
    const road = roadCache[roadName]
    if (!road) {
      continue
    }

    for (const ix of road.intersections) {
      if (isSamePoint(ix, currentPoint)) {
        continue
      }

      // On arrival road: only ahead of current position
      if (roadName === arrivalRoadName) {
        if (!isAhead(previousPoint, currentPoint, ix)) {
          continue
        }
      }

      result.push({ intersection: ix, onRoadName: roadName })
    }
  }

  return result
}

// --- Hook ---

export type RoutePhase = 'loading' | 'at-start' | 'at-intersection' | 'at-end'

export type UseRouteModeReturn = {
  phase: RoutePhase
  start: RouteAddress
  end: RouteAddress
  decisions: RouteDecision[]
  availableIntersections: SelectableIntersection[]
  canReachEnd: boolean
  /** Ordered lat/lng points of the player's route so far (for polyline) */
  selectedRoute: { lat: number; lng: number }[]
  handleIntersectionClick: (selectable: SelectableIntersection) => void
  handleDestinationClick: () => void
  isComplete: boolean
  isLoading: boolean
  resetRouteState: () => void
  roadCache: RoadCache
  pendingCount: number
}

export const useRouteMode = (): UseRouteModeReturn => {
  const seed = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.seed,
  )

  const { start, end } = useMemo(
    function pickAddresses() {
      const rng = createSeededRng(seed)
      return pickRoutePair(rng)
    },
    [seed],
  )

  const { roadCache, fetchRoad, pendingCount, resetCache } = useRoadCache()

  const [phase, setPhase] = useState<RoutePhase>('loading')
  const [decisions, setDecisions] = useState<RouteDecision[]>([])
  const [arrivalRoadName, setArrivalRoadName] = useState(start.roadName)

  // --- Derived positions ---

  const currentIntersection =
    decisions.length > 0 ? decisions[decisions.length - 1]!.intersection : null

  const previousPosition: { lat: number; lng: number } =
    decisions.length >= 2
      ? decisions[decisions.length - 2]!.intersection
      : { lat: start.lat, lng: start.lng }

  // --- Initial fetch ---

  useEffect(
    function initStartRoad() {
      fetchRoad(start.roadName).then(function onStartRoadLoaded(road) {
        if (road) {
          setPhase('at-start')
        }
      })
    },
    [start.roadName, fetchRoad],
  )

  // --- Available intersections (reactive to cache updates) ---

  const availableIntersections = useMemo(
    function deriveAvailableIntersections(): SelectableIntersection[] {
      if (phase === 'loading' || phase === 'at-end') {
        return []
      }

      if (phase === 'at-start') {
        const road = roadCache[start.roadName]
        if (!road) {
          return []
        }
        return road.intersections.map((ix) => ({
          intersection: ix,
          onRoadName: start.roadName,
        }))
      }

      // phase === 'at-intersection'
      if (!currentIntersection) {
        return []
      }
      return computeAvailableIntersections(
        currentIntersection,
        arrivalRoadName,
        previousPosition,
        roadCache,
      )
    },
    [
      phase,
      roadCache,
      currentIntersection,
      arrivalRoadName,
      previousPosition,
      start.roadName,
    ],
  )

  // --- Can the player reach the destination from here? ---

  const canReachEnd = useMemo(
    function deriveCanReachEnd() {
      if (phase !== 'at-intersection' || !currentIntersection) {
        return false
      }
      const roads = getRoadsAtPoint(
        currentIntersection,
        arrivalRoadName,
        roadCache,
      )
      return roads.includes(end.roadName)
    },
    [phase, currentIntersection, arrivalRoadName, roadCache, end.roadName],
  )

  // --- Polyline path ---

  const selectedRoute = useMemo(
    function deriveSelectedRoute() {
      const points: { lat: number; lng: number }[] = [
        { lat: start.lat, lng: start.lng },
      ]
      for (const decision of decisions) {
        points.push({
          lat: decision.intersection.lat,
          lng: decision.intersection.lng,
        })
      }
      if (phase === 'at-end') {
        points.push({ lat: end.lat, lng: end.lng })
      }
      return points
    },
    [decisions, start, end, phase],
  )

  // --- Handlers ---

  const handleIntersectionClick = useCallback(
    function onIntersectionClick(selectable: SelectableIntersection) {
      if (phase !== 'at-start' && phase !== 'at-intersection') {
        return
      }

      const decision: RouteDecision = {
        intersection: selectable.intersection,
        fromRoadName: selectable.onRoadName,
      }

      setDecisions((prev) => [...prev, decision])
      setArrivalRoadName(selectable.onRoadName)
      setPhase('at-intersection')

      // Pre-fetch cross road at the new intersection + the road itself
      fetchRoad(selectable.intersection.otherRoadName)
      fetchRoad(selectable.onRoadName)
    },
    [phase, fetchRoad],
  )

  const handleDestinationClick = useCallback(
    function onDestinationClick() {
      if (!canReachEnd) {
        return
      }
      setPhase('at-end')
    },
    [canReachEnd],
  )

  const resetRouteState = useCallback(
    function resetRoute() {
      setPhase('loading')
      setDecisions([])
      setArrivalRoadName(start.roadName)
      resetCache()
      fetchRoad(start.roadName).then(function onReload(road) {
        if (road) {
          setPhase('at-start')
        }
      })
    },
    [start.roadName, resetCache, fetchRoad],
  )

  return {
    phase,
    start,
    end,
    decisions,
    availableIntersections,
    canReachEnd,
    selectedRoute,
    handleIntersectionClick,
    handleDestinationClick,
    isComplete: phase === 'at-end',
    isLoading: phase === 'loading',
    resetRouteState,
    roadCache,
    pendingCount,
  }
}
