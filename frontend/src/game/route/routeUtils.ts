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

const getClosestJunctionCluster = (
  candidates: RoadJunction[],
  refLat: number,
  refLng: number,
  roundaboutJunctions: RoadJunction[],
): RoadJunction[] => {
  // be wary that different RoadJunction lists might not share POV.
  //   They belong to different roads and thus have different roadJunctionIndexes,
  //   even though the junction is the same
  const roundAboutJunctionCandidates = roundaboutJunctions.filter((rj) =>
    candidates.map((c) => c.id).includes(rj.id),
  )
  if (roundAboutJunctionCandidates.length === 0) {
    return []
  }

  const candidateClusters: RoadJunction[][] = []
  const sortedCandidates = roundAboutJunctionCandidates.sort(
    (a, b) => a.roadJunctionIndex - b.roadJunctionIndex,
  )

  let current = [sortedCandidates[0]]

  for (let i = 1; i < sortedCandidates.length; i++) {
    if (
      sortedCandidates[i].roadJunctionIndex -
        sortedCandidates[i - 1].roadJunctionIndex ===
      1
    ) {
      current.push(sortedCandidates[i])
    } else {
      candidateClusters.push(current)
      current = [sortedCandidates[i]]
    }
  }
  candidateClusters.push(current)

  const first = candidateClusters[0]
  const last = candidateClusters[candidateClusters.length - 1]
  if (
    candidateClusters.length > 1 &&
    first[0].roadJunctionIndex === 0 &&
    last[last.length - 1].roadJunctionIndex + 1 === roundaboutJunctions.length
  ) {
    candidateClusters.shift()
    candidateClusters.push([...last, ...first])
  }

  const calculateAvgDistanceForCluster = (cluster: RoadJunction[]) =>
    cluster
      .map((junction) =>
        haversineDistanceMeters(refLat, refLng, junction.lat, junction.lng),
      )
      .reduce((prev, distance) => prev + distance, 0)

  return candidateClusters.reduce(
    (prev, cluster) =>
      calculateAvgDistanceForCluster(cluster) <=
      calculateAvgDistanceForCluster(prev)
        ? cluster
        : prev,
    candidateClusters[0],
  )
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
  availableJunctionsFromEntry: RoadJunction[],
  refLat: number,
  refLng: number,
  roundaboutJunctions: RoadJunction[],
): RoadJunction => {
  const closestCluster = getClosestJunctionCluster(
    availableJunctionsFromEntry,
    refLat,
    refLng,
    roundaboutJunctions,
  )

  // Returning last in cluster assumes that the cluster stops at the entrance - doesn't work for
  // e.g. three-way roundabout:([road_name:entrance_number]) [Road A:0] - [Road A:1] - [Road B:2] - [Road A:0]
  // WIP
  return closestCluster[closestCluster.length - 1]
}

/**
 * Finds the roundabout exit junction for the given target road.
 * Among roundabout junctions whose connectedRoadNames includes targetRoadName,
 * returns the one with the closest ring index in increasing order from entryRingIndex.
 */
export const findExitJunction = (
  availableJunctionsFromExit: RoadJunction[],
  roundaboutJunctions: RoadJunction[],
  refLat: number,
  refLng: number,
): RoadJunction | null => {
  if (availableJunctionsFromExit.length === 0) {
    return null
  }
  if (availableJunctionsFromExit.length === 1) {
    return availableJunctionsFromExit[0]
  }

  const closestCluster = getClosestJunctionCluster(
    availableJunctionsFromExit,
    refLat,
    refLng,
    roundaboutJunctions,
  )

  // Returning first in cluster only works if there are two clusters for road
  // on each opposite sides of roundabout. WIP
  return closestCluster[0]
}
