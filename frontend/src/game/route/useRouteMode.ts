import { useEffect, useReducer } from 'react'
import { createSeededRng } from '../utils'
import { selectRoutePair } from './addresses'
import { useRoadGraph, type AvailableIntersection } from './useRoadGraph'
import type {
  LatLng,
  RouteAddress,
  RouteDecision,
  RouteGamePhase,
} from './types'

export type RouteMode = {
  phase: RouteGamePhase
  startAddress: RouteAddress
  endAddress: RouteAddress
  decisions: RouteDecision[]
  /** Route polyline coordinates (start address + each decision point). */
  routeCoords: LatLng[]
  availableIntersections: AvailableIntersection[]
  /** True when the destination marker should be selectable. */
  isDestinationReachable: boolean
  isComplete: boolean
  isLoading: boolean
  error: string | null
  handleIntersectionClick: (intersection: AvailableIntersection) => void
  handleDestinationClick: () => void
  reset: () => void
}

type RouteModeProps = {
  seed: string
}

type RouteModeState = {
  phase: RouteGamePhase
  decisions: RouteDecision[]
  /** Tracks the seed this state was built for, to detect seed changes. */
  activeSeed: string
}

type RouteModeAction =
  | { type: 'reset'; seed: string }
  | {
      type: 'start-ready'
      startAddress: RouteAddress
      endAddress: RouteAddress
    }
  | {
      type: 'select-intersection'
      decision: RouteDecision
      intersectionId: number
      position: LatLng
    }
  | { type: 'reach-destination' }

const createInitialState = (seed: string): RouteModeState => ({
  phase: { status: 'idle' },
  decisions: [],
  activeSeed: seed,
})

const reducer = (
  state: RouteModeState,
  action: RouteModeAction,
): RouteModeState => {
  switch (action.type) {
    case 'reset':
      return createInitialState(action.seed)
    case 'start-ready':
      return {
        ...state,
        phase: {
          status: 'at-start',
          startAddress: action.startAddress,
          endAddress: action.endAddress,
        },
      }
    case 'select-intersection':
      return {
        ...state,
        decisions: [...state.decisions, action.decision],
        phase: {
          status: 'at-intersection',
          currentIntersectionId: action.intersectionId,
          currentPosition: action.position,
        },
      }
    case 'reach-destination':
      return { ...state, phase: { status: 'at-end' } }
  }
}

export const useRouteMode = ({ seed }: RouteModeProps): RouteMode => {
  const roadGraph = useRoadGraph()

  // Derive start/end from seed (stable across renders for same seed)
  const rng = createSeededRng(seed)
  const { start: startAddress, end: endAddress } = selectRoutePair(rng)

  const [state, dispatch] = useReducer(reducer, seed, createInitialState)

  // Reset when seed changes
  if (state.activeSeed !== seed) {
    dispatch({ type: 'reset', seed })
    roadGraph.reset()
  }

  // Fetch starting road and transition to at-start
  useEffect(
    function fetchStartingRoad() {
      let cancelled = false
      roadGraph
        .fetchRoad(startAddress.roadName)
        .then(function onStartRoadFetched() {
          if (!cancelled) {
            dispatch({ type: 'start-ready', startAddress, endAddress })
          }
        })
      return function cleanupFetch() {
        cancelled = true
      }
    },
    [seed],
  )

  const { phase, decisions } = state

  // Build set of visited intersection IDs for exclusion
  const visitedIds = new Set(decisions.map((d) => d.intersectionId))

  // Compute available intersections based on current phase
  let availableIntersections: AvailableIntersection[] = []
  if (phase.status === 'at-start') {
    availableIntersections = roadGraph.getIntersectionsForRoad(
      startAddress.roadName,
      visitedIds,
    )
  } else if (phase.status === 'at-intersection') {
    availableIntersections = roadGraph.getIntersectionsFromPoint(
      phase.currentIntersectionId,
      visitedIds,
    )
  }

  // Check if destination road is reachable from current position
  const isDestinationReachable =
    phase.status === 'at-intersection' &&
    availableIntersections.some(
      (ix) =>
        ix.otherRoadName === endAddress.roadName ||
        ix.sourceRoadName === endAddress.roadName,
    )

  const routeCoords: LatLng[] = [
    { lat: startAddress.lat, lng: startAddress.lng },
    ...decisions.map((d) => d.position),
  ]

  const handleIntersectionClick = (intersection: AvailableIntersection) => {
    if (phase.status !== 'at-start' && phase.status !== 'at-intersection') {
      return
    }

    const position: LatLng = { lat: intersection.lat, lng: intersection.lng }
    const decision: RouteDecision = {
      intersectionId: intersection.id,
      position,
      roadName: intersection.sourceRoadName,
    }

    dispatch({
      type: 'select-intersection',
      decision,
      intersectionId: intersection.id,
      position,
    })

    // Fetch newly reachable roads that aren't cached yet
    roadGraph.fetchRoad(intersection.otherRoadName)
  }

  const handleDestinationClick = () => {
    if (!isDestinationReachable) {
      return
    }
    dispatch({ type: 'reach-destination' })
  }

  const isComplete = phase.status === 'at-end'

  const reset = () => {
    dispatch({ type: 'reset', seed })
    roadGraph.reset()

    roadGraph
      .fetchRoad(startAddress.roadName)
      .then(function onResetRoadFetched() {
        dispatch({ type: 'start-ready', startAddress, endAddress })
      })
  }

  return {
    phase,
    startAddress,
    endAddress,
    decisions,
    routeCoords,
    availableIntersections,
    isDestinationReachable,
    isComplete,
    isLoading: roadGraph.isLoading,
    error: roadGraph.error,
    handleIntersectionClick,
    handleDestinationClick,
    reset,
  }
}
