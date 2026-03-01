import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { resolveAddress } from '../../api/snapToRoads'
import { getRoutePair } from './routeAddresses'
import { useRoadGraph } from './useRoadGraph'
import type { RouteAddress, SelectedJunction } from './types'
import { computeAvailableJunctions } from './routeUtils'

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
  currentJunctionHasMissingConnectedJunctions: boolean
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
  const [
    currentJunctionHasMissingConnectedJunctions,
    setCurrentJunctionHasMissingConnectedJunctions,
  ] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gameKey, setGameKey] = useState(0)

  // useRef: read fresh state in async callbacks without stale closures
  const pathRef = useRef<SelectedJunction[]>([])
  const isCompleteRef = useRef(false)

  // No deps: must run after every render so async callbacks always read
  // current state, not stale closures from the render that registered them.
  useEffect(function syncRefs() {
    pathRef.current = path
    isCompleteRef.current = isComplete
  })

  const isReady = startAddress !== null && endAddress !== null && !isLoading
  const isGameActive = path.length > 0 && !isComplete

  const lastJunction = path.at(-1) ?? null
  const canReachDestination =
    endAddress !== null &&
    lastJunction !== null &&
    (lastJunction.roadName === endAddress.roadName ||
      lastJunction.connectedRoadNames.includes(endAddress.roadName))

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
        setCurrentJunctionHasMissingConnectedJunctions(false)

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

        const junctions = roadGraph.getJunctionsForRoad(resolvedStart.roadName)
        setCurrentRoadName(resolvedStart.roadName)
        setAvailableJunctions(junctions)
        setIsLoading(false)
      }

      void init().catch((err) => {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to initialize')
          setIsLoading(false)
        }
      })

      return () => {
        isActive = false
      }
    },
    [seed, gameKey, mode, roadGraph],
  )

  const handleJunctionClick = (currentJunction: SelectedJunction) => {
    if (isComplete || isLoading) {
      return
    }

    const prevJunction = path.at(-1) ?? null
    setPath((prev) => [...prev, currentJunction])

    const roadsAtJunction = [
      currentJunction.roadName,
      ...currentJunction.connectedRoadNames,
    ]
    setCurrentRoadName(currentJunction.roadName)

    const toFetch = roadsAtJunction.filter(
      (r) => !roadGraph.isFetchedAsPrimary(r),
    )
    setCurrentJunctionHasMissingConnectedJunctions(
      roadsAtJunction.some((r) => !roadGraph.isInCache(r)),
    )

    if (toFetch.length > 0) {
      void Promise.all(toFetch.map((road) => roadGraph.fetchRoad(road)))
        .then(() => {
          if (isCompleteRef.current) {
            return
          }
          const currentJ = pathRef.current.at(-1)
          if (!currentJ) {
            return
          }
          const roadsHere = [currentJ.roadName, ...currentJ.connectedRoadNames]
          setAvailableJunctions(
            computeAvailableJunctions(
              currentJ,
              pathRef.current.at(-2) ?? null,
              roadGraph,
            ),
          )
          if (roadsHere.every((r) => roadGraph.isInCache(r))) {
            setCurrentJunctionHasMissingConnectedJunctions(false)
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch road')
        })
    }

    // Immediate update with currently cached roads
    setAvailableJunctions(
      computeAvailableJunctions(currentJunction, prevJunction, roadGraph),
    )
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
    setCurrentJunctionHasMissingConnectedJunctions(false)
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
    currentJunctionHasMissingConnectedJunctions,
    error,
    gameKey,
    handleJunctionClick,
    handleDestinationClick,
    canReachDestination,
    reset,
  }
}
