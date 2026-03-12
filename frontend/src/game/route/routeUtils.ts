import type { RoadJunction } from './types'
import type { RoadGraph } from './useRoadGraph'

/**
 * Returns junctions reachable from `currentJunction` for the next move.
 * Includes all junctions on intersecting roads, excluding `currentJunction` itself.
 * On the current road, once direction is established via `prevJunction`, only
 * junctions of the same road in that direction (by `roadJunctionIndex`) are included.
 */
export const canJunctionReachRoad = (
  junction: RoadJunction | null,
  roadName: string | null,
): boolean => {
  if (junction === null || roadName === null) {
    return false
  }
  const lower = roadName.toLowerCase()
  return (
    junction.roadName.toLowerCase() === lower ||
    junction.connectedRoadNames.some((r: string) => r.toLowerCase() === lower)
  )
}

export const computeAvailableJunctions = (
  currentJunction: RoadJunction,
  prevJunction: RoadJunction | null,
  roadGraph: RoadGraph,
): RoadJunction[] => {
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
    currentJunction.roadJunctionIndex > previousOnCurrentRoad!.roadJunctionIndex

  const combined = new Map<number, RoadJunction>()
  for (const road of roadsAtJunction) {
    const isCurrentRoad = road === currentJunction.roadName
    for (const junction of roadGraph.getJunctionsForRoad(road)) {
      if (junction.id === currentJunction.id) {
        continue
      }
      if (isCurrentRoad && isDirectionEstablished) {
        if (
          isGoingForward &&
          junction.roadJunctionIndex <= currentJunction.roadJunctionIndex
        ) {
          continue
        }
        if (
          !isGoingForward &&
          junction.roadJunctionIndex >= currentJunction.roadJunctionIndex
        ) {
          continue
        }
      }
      combined.set(junction.id, junction)
    }
  }
  return [...combined.values()]
}

/** Haversine distance between two lat/lng points, in meters. */
export const haversineDistanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R = 6_371_000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Picks the roundabout entrance junction from candidates (all have the same roundaboutId).
 * Reference point is the last path entry or start address position.
 *
 * // Naïve attempt at selecting entrance junction of roundabout. Some OSM roundabouts have
 * // 2 junctions for entrance/exit, some have 1 shared. If road continues on other side of
 * // roundabout, we want to add the closest one in distance to current path. If 2 junctions
 * // for entrance/exit, we use their roundabout index - increasing order in driving direction
 * // means highest index or 0 is our entrance.
 */
export const pickEntryJunction = (
  candidates: RoadJunction[],
  refLat: number,
  refLng: number,
  roundaboutJunctions: RoadJunction[],
): RoadJunction => {
  const PROXIMITY_THRESHOLD_METERS = 2 // hardcoded: junctions within this distance are treated as equidistant

  const withDist = candidates.map((j) => ({
    junction: j,
    dist: haversineDistanceMeters(refLat, refLng, j.lat, j.lng),
  }))
  withDist.sort((a, b) => a.dist - b.dist)

  const minDist = withDist[0].dist
  const closeEnough = withDist.filter(
    (x) => x.dist - minDist <= PROXIMITY_THRESHOLD_METERS,
  )

  if (closeEnough.length === 1) {
    return closeEnough[0].junction
  }

  // Multiple within threshold: find their ring indices and apply tiebreak rules.
  // Ring index comes from roundaboutJunctions (roadJunctionIndex = ring index).
  const withRingIndex = closeEnough.map((x) => {
    const inRing = roundaboutJunctions.find((rj) => rj.id === x.junction.id)
    return { junction: x.junction, ringIndex: inRing?.roadJunctionIndex ?? -1 }
  })

  const zeroIndex = withRingIndex.find((x) => x.ringIndex === 0)
  if (zeroIndex) {
    return zeroIndex.junction
  }

  return withRingIndex.reduce((best, x) =>
    x.ringIndex > best.ringIndex ? x : best,
  ).junction
}

/**
 * Finds the roundabout exit junction for the given target road.
 * Among roundabout junctions whose connectedRoadNames includes targetRoadName,
 * returns the one with the closest ring index in increasing order from entryRingIndex.
 */
export const findExitJunction = (
  roundaboutJunctions: RoadJunction[],
  entryRingIndex: number,
  targetRoadName: string,
): RoadJunction | null => {
  const lower = targetRoadName.toLowerCase()
  const candidates = roundaboutJunctions.filter((j) =>
    j.connectedRoadNames.some((r) => r.toLowerCase() === lower),
  )
  if (candidates.length === 0) {
    return null
  }
  if (candidates.length === 1) {
    return candidates[0]
  }

  const total = roundaboutJunctions.length
  return candidates.reduce((best, j) => {
    const forwardDist = (j.roadJunctionIndex - entryRingIndex + total) % total
    const bestForwardDist =
      (best.roadJunctionIndex - entryRingIndex + total) % total
    return forwardDist < bestForwardDist ? j : best
  })
}
