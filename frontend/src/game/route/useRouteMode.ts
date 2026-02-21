import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { resolveAddress } from '../../api/snapToRoads'
import { getRoutePair } from './routeAddresses'
import { useRoadGraph } from './useRoadGraph'
import type { SelectedIntersection, SnappedAddress } from './types'

type RouteMode = {
  startAddress: SnappedAddress | null
  endAddress: SnappedAddress | null
  path: SelectedIntersection[]
  availableIntersections: SelectedIntersection[]
  currentRoadName: string | null
  isLoading: boolean
  isReady: boolean
  isComplete: boolean
  error: string | null
  handleIntersectionClick: (intersection: SelectedIntersection) => void
  handleDestinationClick: () => void
  canReachDestination: boolean
  reset: () => void
}

export const useRouteMode = (): RouteMode => {
  const seed = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.seed,
  )
  const roadGraph = useRoadGraph()

  const [startAddress, setStartAddress] = useState<SnappedAddress | null>(null)
  const [endAddress, setEndAddress] = useState<SnappedAddress | null>(null)
  const [path, setPath] = useState<SelectedIntersection[]>([])
  const [availableIntersections, setAvailableIntersections] = useState<
    SelectedIntersection[]
  >([])
  const [currentRoadName, setCurrentRoadName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isReady = startAddress !== null && endAddress !== null && !isLoading

  const lastIntersection = path.at(-1) ?? null
  const canReachDestination =
    endAddress !== null &&
    lastIntersection !== null &&
    (lastIntersection.roadName === endAddress.roadName ||
      lastIntersection.otherRoadName === endAddress.roadName)

  // Init flow: resolve addresses, fetch starting road
  useEffect(
    function initRouteMode() {
      let isActive = true

      const init = async () => {
        setIsLoading(true)
        setError(null)
        setPath([])
        setIsComplete(false)

        try {
          const [rawStart, rawEnd] = getRoutePair(seed)
          const [resolvedStart, resolvedEnd] = await Promise.all([
            resolveAddress(rawStart),
            resolveAddress(rawEnd),
          ])

          if (!isActive) {
            return
          }

          setStartAddress(resolvedStart)
          setEndAddress(resolvedEnd)

          // Fetch the starting road
          await roadGraph.fetchRoad(resolvedStart.roadName)
          if (!isActive) {
            return
          }

          const intersections = roadGraph.getIntersectionsForRoad(
            resolvedStart.roadName,
          )
          setCurrentRoadName(resolvedStart.roadName)
          setAvailableIntersections(intersections)
          setIsLoading(false)
        } catch (err) {
          if (!isActive) {
            return
          }
          setError(
            err instanceof Error ? err.message : 'Failed to initialize route',
          )
          setIsLoading(false)
        }
      }

      void init()

      return () => {
        isActive = false
      }
    },
    [seed],
  )

  const handleIntersectionClick = (intersection: SelectedIntersection) => {
    if (isComplete || isLoading) {
      return
    }

    setPath((prev) => [...prev, intersection])

    // All roads meeting at this intersection
    const roadsAtIntersection = [
      intersection.roadName,
      intersection.otherRoadName,
    ]
    setCurrentRoadName(intersection.otherRoadName)

    // Fetch any roads not yet primary-fetched, then combine all intersections
    const toFetch = roadsAtIntersection.filter(
      (r) => !roadGraph.isFetchedAsPrimary(r),
    )

    const updateAvailable = () => {
      const combined = new Map<number, SelectedIntersection>()
      for (const road of roadsAtIntersection) {
        for (const ix of roadGraph.getIntersectionsForRoad(road)) {
          if (ix.id !== intersection.id) {
            combined.set(ix.id, ix)
          }
        }
      }
      setAvailableIntersections([...combined.values()])
    }

    if (toFetch.length > 0) {
      setIsLoading(true)
      void Promise.all(toFetch.map((r) => roadGraph.fetchRoad(r)))
        .then(() => {
          updateAvailable()
          setIsLoading(false)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch road')
          setIsLoading(false)
        })
    } else {
      updateAvailable()
    }
  }

  const handleDestinationClick = () => {
    if (!canReachDestination) {
      return
    }
    setIsComplete(true)
    setAvailableIntersections([])
  }

  const reset = () => {
    roadGraph.reset()
    setStartAddress(null)
    setEndAddress(null)
    setPath([])
    setAvailableIntersections([])
    setCurrentRoadName(null)
    setIsLoading(true)
    setIsComplete(false)
    setError(null)
  }

  return {
    startAddress,
    endAddress,
    path,
    availableIntersections,
    currentRoadName,
    isLoading,
    isReady,
    isComplete,
    error,
    handleIntersectionClick,
    handleDestinationClick,
    canReachDestination,
    reset,
  }
}
