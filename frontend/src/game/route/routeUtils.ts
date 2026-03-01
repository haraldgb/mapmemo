import type { SelectedJunction } from './types'
import type { RoadGraph } from './useRoadGraph'

/**
 * Returns junctions reachable from `currentJunction` for the next move.
 * Includes all junctions on intersecting roads, excluding `currentJunction` itself.
 * On the current road, once direction is established via `prevJunction`, only
 * junctions of the same road in that direction (by `nodeIndex`) are included.
 */
export const computeAvailableJunctions = (
  currentJunction: SelectedJunction,
  prevJunction: SelectedJunction | null,
  roadGraph: RoadGraph,
): SelectedJunction[] => {
  const roadsAtJunction = [
    currentJunction.roadName,
    ...currentJunction.connectedRoadNames,
  ]

  const previousOnCurrentRoad =
    prevJunction !== null
      ? (roadGraph
          .getJunctionsForRoad(currentJunction.roadName)
          .find((j) => j.id === prevJunction.id) ?? null)
      : null

  const isDirectionEstablished = previousOnCurrentRoad !== null
  const isGoingForward =
    isDirectionEstablished &&
    currentJunction.nodeIndex > previousOnCurrentRoad!.nodeIndex

  const combined = new Map<number, SelectedJunction>()
  for (const road of roadsAtJunction) {
    const isCurrentRoad = road === currentJunction.roadName
    for (const junction of roadGraph.getJunctionsForRoad(road)) {
      if (junction.id === currentJunction.id) {
        continue
      }
      if (isCurrentRoad && isDirectionEstablished) {
        if (isGoingForward && junction.nodeIndex <= currentJunction.nodeIndex) {
          continue
        }
        if (
          !isGoingForward &&
          junction.nodeIndex >= currentJunction.nodeIndex
        ) {
          continue
        }
      }
      combined.set(junction.id, junction)
    }
  }
  return [...combined.values()]
}
