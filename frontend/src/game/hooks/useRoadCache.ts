import { useCallback, useRef, useState } from 'react'
import { fetchRoadWithIntersections, type RoadInfo } from '../../api/roadData'
import type { RoadCache } from '../routeTypes'

type UseRoadCacheReturn = {
  roadCache: RoadCache
  /** Fetch a road and its branches. No-op if already cached. Returns the RoadInfo. */
  fetchRoad: (roadName: string) => Promise<RoadInfo | null>
  /** Number of in-flight fetches */
  pendingCount: number
  /** Reset the cache (e.g. on game restart) */
  resetCache: () => void
}

const CITY_NAME = 'Oslo'

export const useRoadCache = (): UseRoadCacheReturn => {
  const [roadCache, setRoadCache] = useState<RoadCache>({})
  const [pendingCount, setPendingCount] = useState(0)

  // Ref mirror of cache for stable fetchRoad identity
  const cacheRef = useRef<RoadCache>(roadCache)
  cacheRef.current = roadCache

  // Track in-flight fetches to avoid duplicate requests
  const inflightRef = useRef<Record<string, Promise<RoadInfo | null>>>({})

  const fetchRoad = useCallback(async function fetchRoadByName(
    roadName: string,
  ): Promise<RoadInfo | null> {
    // Return from cache if available
    const cached = cacheRef.current[roadName]
    if (cached) {
      return cached
    }

    // Dedupe in-flight requests
    const inflight = inflightRef.current[roadName]
    if (inflight) {
      return inflight
    }

    const promise = (async () => {
      setPendingCount((prev) => prev + 1)
      try {
        const response = await fetchRoadWithIntersections(CITY_NAME, roadName)
        // Merge all returned roads into cache (queried road + branches)
        setRoadCache((prev) => ({ ...prev, ...response }))
        return response[roadName] ?? null
      } catch {
        return null
      } finally {
        setPendingCount((prev) => prev - 1)
        delete inflightRef.current[roadName]
      }
    })()

    inflightRef.current[roadName] = promise
    return promise
  }, [])

  const resetCache = useCallback(function clearRoadCache() {
    setRoadCache({})
    inflightRef.current = {}
    setPendingCount(0)
  }, [])

  return { roadCache, fetchRoad, pendingCount, resetCache }
}
