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

  const canReachDestination =
    endAddress !== null &&
    availableIntersections.some(
      (ix) => ix.otherRoadName === endAddress.roadName,
    )

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

    // Turn onto the other road
    const nextRoadName = intersection.otherRoadName
    setCurrentRoadName(nextRoadName)

    // Fetch next road if not already primary-fetched
    if (!roadGraph.isFetchedAsPrimary(nextRoadName)) {
      setIsLoading(true)
      void roadGraph
        .fetchRoad(nextRoadName)
        .then(() => {
          const intersections = roadGraph.getIntersectionsForRoad(nextRoadName)
          // Filter out the intersection we just came from
          const filtered = intersections.filter(
            (ix) => ix.id !== intersection.id,
          )
          setAvailableIntersections(filtered)
          setIsLoading(false)
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch road')
          setIsLoading(false)
        })
    } else {
      const intersections = roadGraph.getIntersectionsForRoad(nextRoadName)
      const filtered = intersections.filter((ix) => ix.id !== intersection.id)
      setAvailableIntersections(filtered)
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
