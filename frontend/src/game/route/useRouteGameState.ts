import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { resolveAddress } from '../../api/snapToRoads'
import { getRoutePair } from './routeAddresses'
import { useRoadGraph } from './useRoadGraph'
import type { RouteAddress, SelectedJunction } from './types'

export type RouteGameState = {
  mode: 'route'
  startAddress: RouteAddress | null
  endAddress: RouteAddress | null
  path: SelectedJunction[]
  availableJunctions: SelectedJunction[]
  currentRoadName: string | null
  isLoading: boolean
  isReady: boolean
  isComplete: boolean
  isGameActive: boolean
  error: string | null
  gameKey: number
  handleJunctionClick: (junction: SelectedJunction) => void
  handleDestinationClick: () => void
  canReachDestination: boolean
  reset: () => void
}

/**
 * State machine for route-based game mode.
 * Manages address resolution, road graph traversal, and path building.
 * Returns `null` when the active mode is not `route`.
 */
export const useRouteGameState = (): RouteGameState | null => {
  const { seed, mode } = useSelector(
    (state: RootState) => state.mapmemo.gameSettings,
  )
  const roadGraph = useRoadGraph()

  const [startAddress, setStartAddress] = useState<RouteAddress | null>(null)
  const [endAddress, setEndAddress] = useState<RouteAddress | null>(null)
  const [path, setPath] = useState<SelectedJunction[]>([])
  const [availableJunctions, setAvailableJunctions] = useState<
    SelectedJunction[]
  >([])
  const [currentRoadName, setCurrentRoadName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameKey, setGameKey] = useState(0)

  const isReady = startAddress !== null && endAddress !== null && !isLoading
  const isGameActive = path.length > 0 && !isComplete

  const lastJunction = path.at(-1) ?? null
  const canReachDestination =
    endAddress !== null &&
    lastJunction !== null &&
    (lastJunction.roadName === endAddress.roadName ||
      lastJunction.otherRoadName === endAddress.roadName)

  // Init flow: resolve addresses, fetch starting road
  useEffect(
    function initRouteMode() {
      if (mode !== 'route') {
        return
      }

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

          const junctions = roadGraph.getJunctionsForRoad(
            resolvedStart.roadName,
          )
          setCurrentRoadName(resolvedStart.roadName)
          setAvailableJunctions(junctions)
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
    [seed, gameKey, mode],
  )

  const handleJunctionClick = (currentJunction: SelectedJunction) => {
    if (isComplete || isLoading) {
      return
    }

    setPath((prev) => [...prev, currentJunction])

    // All roads meeting at this junction
    const roadsAtJunction = [currentJunction.roadName, currentJunction.otherRoadName]
    setCurrentRoadName(currentJunction.otherRoadName)

    // Fetch any roads not yet primary-fetched, then combine all junctions
    const toFetch = roadsAtJunction.filter(
      (r) => !roadGraph.isFetchedAsPrimary(r),
    )
    void Promise.all(toFetch.map((road) => roadGraph.fetchRoad(road))).catch(
      // Fetching a road pre-fetches roads that share junctions with it, so we don't have to wait for fetches.
      (err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch road')
      },
    )

    const updateAvailable = () => {
      const combined = new Map<number, SelectedJunction>()
      for (const road of roadsAtJunction) {
        for (const junction of roadGraph.getJunctionsForRoad(road)) {
          if (junction.id !== currentJunction.id) {
            combined.set(junction.id, junction)
          }
        }
      }
      setAvailableJunctions([...combined.values()])
    }

    updateAvailable()
  }

  const handleDestinationClick = () => {
    if (!canReachDestination) {
      return
    }
    setIsComplete(true)
    setAvailableJunctions([])
  }

  const reset = () => {
    setStartAddress(null)
    setEndAddress(null)
    setPath([])
    setAvailableJunctions([])
    setCurrentRoadName(null)
    setIsLoading(true)
    setIsComplete(false)
    setError(null)
    setGameKey((k) => k + 1)
  }

  // All hooks called above — safe to bail out for non-route modes.
  if (mode !== 'route') {
    return null
  }

  return {
    mode: 'route',
    startAddress,
    endAddress,
    path,
    availableJunctions,
    currentRoadName,
    isLoading,
    isReady,
    isComplete,
    isGameActive,
    error,
    gameKey,
    handleJunctionClick,
    handleDestinationClick,
    canReachDestination,
    reset,
  }
}
