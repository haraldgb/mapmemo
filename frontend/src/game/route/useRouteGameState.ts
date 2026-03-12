import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store'
import { resolveAddress } from '../../api/snapToRoads'
import { getRoutePair } from './routeAddresses'
import { useRoadGraph } from './useRoadGraph'
import type { RouteAddress, RoadJunction } from './types'
import {
  computeAvailableJunctions,
  canJunctionReachRoad,
  pickEntryJunction,
  findExitJunction,
} from './routeUtils'

export type RouteGameState = {
  mode: 'route'
  startAddress: RouteAddress | null
  endAddress: RouteAddress | null
  path: RoadJunction[]
  availableJunctions: RoadJunction[]
  selectableJunctions: RoadJunction[]
  availableRoundabouts: number[]
  currentRoadName: string | null
  isLoading: boolean
  isReady: boolean
  isComplete: boolean
  isGameActive: boolean
  currentJunctionHasMissingConnectedJunctions: boolean
  error: string | null
  gameKey: number
  handleJunctionClick: (junction: RoadJunction) => void
  handleRoundaboutClick: (roundaboutId: number) => void
  handleDestinationClick: () => void
  canReachDestination: boolean
  getJunctionsForRoundabout: (roundaboutId: number) => RoadJunction[]
  reset: () => void
}

/**
 * State machine for route-based game mode.
 * Manages address resolution, road graph traversal, and path building.
 * Returns `null` when the active mode is not `route`.
 */
export const useRouteGameState = (): RouteGameState | null => {
  const { seed, mode, routeAddresses } = useSelector(
    (state: RootState) => state.mapmemo.gameSettings,
  )
  const cityId = useSelector(
    (state: RootState) => state.mapmemo.cityInfo?.id ?? 0,
  )
  const roadGraph = useRoadGraph(cityId)

  const [startAddress, setStartAddress] = useState<RouteAddress | null>(null)
  const [endAddress, setEndAddress] = useState<RouteAddress | null>(null)
  const [path, setPath] = useState<RoadJunction[]>([])
  const [availableJunctions, setAvailableJunctions] = useState<RoadJunction[]>(
    [],
  )
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
  const pathRef = useRef<RoadJunction[]>([])
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
  const canReachDestination = canJunctionReachRoad(
    lastJunction,
    endAddress?.roadName ?? null,
  )

  const selectableJunctions = availableJunctions.filter(
    (j) => j.roundaboutId === null,
  )
  const availableRoundabouts = [
    ...new Set(
      availableJunctions
        .filter((j) => j.roundaboutId !== null)
        .map((j) => j.roundaboutId!),
    ),
  ]

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

        const [rawStart, rawEnd] = getRoutePair(seed, routeAddresses)
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
        const startRoad = await roadGraph.fetchRoad(resolvedStart.roadName)
        if (!isActive) {
          return
        }

        const junctions = roadGraph.getJunctionsForRoad(resolvedStart.roadName)
        // Use OSM canonical name for display (may differ in capitalisation from Google Maps)
        setCurrentRoadName(startRoad?.name ?? resolvedStart.roadName)
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
    [seed, gameKey, mode, roadGraph, routeAddresses],
  )

  const handleJunctionClick = (currentJunction: RoadJunction) => {
    if (isComplete || isLoading) {
      return
    }

    const prevJunction = path.at(-1) ?? null
    const isExitingRoundabout = prevJunction?.roundaboutId != null

    let newPath: RoadJunction[]
    let effectivePrev: RoadJunction | null = prevJunction

    if (isExitingRoundabout) {
      const roundaboutId = prevJunction!.roundaboutId!
      const roundaboutJunctions =
        roadGraph.getJunctionsForRoundabout(roundaboutId)
      const entryInRing = roundaboutJunctions.find(
        (j) => j.id === prevJunction!.id,
      )
      const entryRingIndex = entryInRing?.roadJunctionIndex ?? 0
      const rawExitJunction = findExitJunction(
        roundaboutJunctions,
        entryRingIndex,
        currentJunction.roadName,
      )
      // Tag exit junction with the road we're exiting onto so direction logic works
      const exitJunction = rawExitJunction
        ? { ...rawExitJunction, roadName: currentJunction.roadName }
        : null

      if (exitJunction && exitJunction.id !== prevJunction!.id) {
        newPath = [...path, exitJunction, currentJunction]
        effectivePrev = exitJunction
      } else {
        newPath = [...path, currentJunction]
      }
    } else {
      newPath = [...path, currentJunction]
    }

    setPath(newPath)

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
      computeAvailableJunctions(currentJunction, effectivePrev, roadGraph),
    )
  }

  const handleRoundaboutClick = (roundaboutId: number) => {
    if (isComplete || isLoading) {
      return
    }

    const roundabout = roadGraph.getRoundabout(roundaboutId)
    if (!roundabout) {
      return
    }

    // Find entry junction: available junctions belonging to this roundabout
    const candidatesFromCurrentRoad = availableJunctions.filter(
      (j) => j.roundaboutId === roundaboutId,
    )
    if (candidatesFromCurrentRoad.length === 0) {
      return
    }

    const refLat = path.at(-1)?.lat ?? startAddress?.lat ?? 0
    const refLng = path.at(-1)?.lng ?? startAddress?.lng ?? 0
    const roundaboutJunctions =
      roadGraph.getJunctionsForRoundabout(roundaboutId)

    const entryJunction = pickEntryJunction(
      candidatesFromCurrentRoad,
      refLat,
      refLng,
      roundaboutJunctions,
    )

    setPath((prev) => [...prev, entryJunction])
    setCurrentRoadName(entryJunction.roadName)

    const computeExternalJunctions = (): RoadJunction[] => {
      const connectedRoads =
        roadGraph.getRoundabout(roundaboutId)?.connectedRoadNames ?? []
      return connectedRoads
        .flatMap((roadName) => roadGraph.getJunctionsForRoad(roadName))
        .filter((j) => j.roundaboutId !== roundaboutId)
        .filter((j, i, arr) => arr.findIndex((x) => x.id === j.id) === i)
    }

    // Fetch all connected roads as primary roads
    const toFetch = roundabout.connectedRoadNames.filter(
      (r) => !roadGraph.isFetchedAsPrimary(r),
    )
    setCurrentJunctionHasMissingConnectedJunctions(
      roundabout.connectedRoadNames.some((r) => !roadGraph.isInCache(r)),
    )

    if (toFetch.length > 0) {
      void Promise.all(toFetch.map((road) => roadGraph.fetchRoad(road)))
        .then(() => {
          if (isCompleteRef.current) {
            return
          }
          const lastJ = pathRef.current.at(-1)
          // Guard: only update if we're still in this roundabout context
          if (!lastJ || lastJ.roundaboutId !== roundaboutId) {
            return
          }
          setAvailableJunctions(computeExternalJunctions())
          if (
            roundabout.connectedRoadNames.every((r) => roadGraph.isInCache(r))
          ) {
            setCurrentJunctionHasMissingConnectedJunctions(false)
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch road')
        })
    }

    setAvailableJunctions(computeExternalJunctions())
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
    selectableJunctions,
    availableRoundabouts,
    currentRoadName,
    isLoading,
    isReady,
    isComplete,
    isGameActive,
    currentJunctionHasMissingConnectedJunctions,
    error,
    gameKey,
    handleJunctionClick,
    handleRoundaboutClick,
    handleDestinationClick,
    canReachDestination,
    getJunctionsForRoundabout: roadGraph.getJunctionsForRoundabout,
    reset,
  }
}
