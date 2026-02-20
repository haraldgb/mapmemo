import { useCallback, useRef, useState } from 'react'
import {
  fetchRoadWithIntersections,
  type RoadInfo,
  type RoadIntersection,
} from '../../api/roadData'

type RoadCache = Record<string, RoadInfo>

export type AvailableIntersection = RoadIntersection & {
  /** The road this intersection belongs to (the road the player is currently on). */
  sourceRoadName: string
}

type RoadGraphState = {
  cache: RoadCache
  isLoading: boolean
  error: string | null
}

export type RoadGraph = {
  cache: RoadCache
  isLoading: boolean
  error: string | null
  /** Fetch a road and merge its data + branching roads into the cache. */
  fetchRoad: (roadName: string) => Promise<void>
  /** Get all intersections reachable from a given road, excluding already-visited ones. */
  getIntersectionsForRoad: (
    roadName: string,
    excludeIds?: Set<number>,
  ) => AvailableIntersection[]
  /** Get all intersections reachable from a given intersection (all roads that cross it). */
  getIntersectionsFromPoint: (
    intersectionId: number,
    excludeIds?: Set<number>,
  ) => AvailableIntersection[]
  /** Reset the cache (new game). */
  reset: () => void
}

const CITY_NAME = 'Oslo'

export const useRoadGraph = (): RoadGraph => {
  const [state, setState] = useState<RoadGraphState>({
    cache: {},
    isLoading: false,
    error: null,
  })
  // Keep a ref in sync so callbacks always see latest cache without re-rendering
  const cacheRef = useRef<RoadCache>(state.cache)

  const fetchRoad = useCallback(async function fetchRoadCb(roadName: string) {
    // Skip if already cached
    if (cacheRef.current[roadName]) {
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response = await fetchRoadWithIntersections(CITY_NAME, roadName)
      setState(function mergeRoadResponse(prev) {
        const merged = { ...prev.cache, ...response }
        cacheRef.current = merged
        return { cache: merged, isLoading: false, error: null }
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch road data'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [])

  const getIntersectionsForRoad = useCallback(
    function getIntersectionsForRoadCb(
      roadName: string,
      excludeIds: Set<number> = new Set(),
    ): AvailableIntersection[] {
      const road = cacheRef.current[roadName]
      if (!road) {
        return []
      }
      return road.intersections
        .filter((ix) => !excludeIds.has(ix.id))
        .map((ix) => ({ ...ix, sourceRoadName: roadName }))
    },
    [],
  )

  const getIntersectionsFromPoint = useCallback(
    function getIntersectionsFromPointCb(
      intersectionId: number,
      excludeIds: Set<number> = new Set(),
    ): AvailableIntersection[] {
      const result: AvailableIntersection[] = []
      const seen = new Set<number>(excludeIds)
      seen.add(intersectionId)

      // Find all roads that pass through this intersection
      for (const road of Object.values(cacheRef.current)) {
        const hasIntersection = road.intersections.some(
          (ix) => ix.id === intersectionId,
        )
        if (!hasIntersection) {
          continue
        }

        // Add all other intersections on this road
        for (const ix of road.intersections) {
          if (seen.has(ix.id)) {
            continue
          }
          seen.add(ix.id)
          result.push({ ...ix, sourceRoadName: road.name })
        }
      }

      return result
    },
    [],
  )

  const reset = useCallback(function resetRoadGraph() {
    cacheRef.current = {}
    setState({ cache: {}, isLoading: false, error: null })
  }, [])

  return {
    cache: state.cache,
    isLoading: state.isLoading,
    error: state.error,
    fetchRoad,
    getIntersectionsForRoad,
    getIntersectionsFromPoint,
    reset,
  }
}
