import { canJunctionReachRoad, computeAvailableJunctions } from './routeUtils'
import type { SelectedJunction } from './types'
import type { RoadGraph } from './useRoadGraph'

const makeJunction = (
  id: number,
  roadName: string,
  nodeIndex: number,
  connectedRoadNames: string[] = [],
): SelectedJunction => ({
  id,
  lat: 59.9,
  lng: 10.7,
  nodeIndex,
  roadName,
  connectedRoadNames,
})

const makeGraph = (roads: Record<string, SelectedJunction[]>): RoadGraph =>
  ({
    getJunctionsForRoad: (name: string) => roads[name] ?? [],
  }) as RoadGraph

describe('canJunctionReachRoad', () => {
  test('returns false when junction is null', () => {
    expect(canJunctionReachRoad(null, 'Akersgata')).toBe(false)
  })

  test('returns false when roadName is null', () => {
    expect(canJunctionReachRoad(makeJunction(1, 'Akersgata', 0), null)).toBe(
      false,
    )
  })

  test('matches own road name', () => {
    expect(
      canJunctionReachRoad(makeJunction(1, 'Akersgata', 0), 'Akersgata'),
    ).toBe(true)
  })

  test('matches connected road name', () => {
    const junction = makeJunction(1, 'Karl Johans gate', 0, [
      'Akersgata',
      'Storgata',
    ])
    expect(canJunctionReachRoad(junction, 'Storgata')).toBe(true)
  })

  test('returns false when road not reachable', () => {
    const junction = makeJunction(1, 'Karl Johans gate', 0, ['Akersgata'])
    expect(canJunctionReachRoad(junction, 'Storgata')).toBe(false)
  })

  test('is case-insensitive', () => {
    const junction = makeJunction(1, 'Karl Johans gate', 0, ['Akersgata'])
    expect(canJunctionReachRoad(junction, 'karl johans GATE')).toBe(true)
    expect(canJunctionReachRoad(junction, 'AKERSGATA')).toBe(true)
  })
})

describe('computeAvailableJunctions', () => {
  // Graph: Akersgata (nodes 1,3,5) crosses Karl Johans gate (nodes 2,7)
  // Current junction is J3 (Akersgata, nodeIndex=3)
  const J1 = makeJunction(1, 'Akersgata', 1)
  const J3 = makeJunction(3, 'Akersgata', 3, ['Karl Johans gate'])
  const J5 = makeJunction(5, 'Akersgata', 5)
  const KJ2 = makeJunction(12, 'Karl Johans gate', 2)
  const KJ7 = makeJunction(17, 'Karl Johans gate', 7)

  const graph = makeGraph({
    Akersgata: [J1, J3, J5],
    'Karl Johans gate': [KJ2, KJ7],
  })

  const ids = (junctions: SelectedJunction[]) =>
    junctions.map((j) => j.id).sort((a, b) => a - b)

  test('no prevJunction: returns all junctions on all roads except self', () => {
    expect(ids(computeAvailableJunctions(J3, null, graph))).toEqual(
      ids([J1, J5, KJ2, KJ7]),
    )
  })

  test('going forward: excludes junctions at or behind current nodeIndex on current road', () => {
    // prev=J1 (nodeIndex=1) → forward → only J5 (nodeIndex=5) on Akersgata
    expect(ids(computeAvailableJunctions(J3, J1, graph))).toEqual(
      ids([J5, KJ2, KJ7]),
    )
  })

  test('going backward: excludes junctions at or ahead of current nodeIndex on current road', () => {
    // prev=J5 (nodeIndex=5) → backward → only J1 (nodeIndex=1) on Akersgata
    expect(ids(computeAvailableJunctions(J3, J5, graph))).toEqual(
      ids([J1, KJ2, KJ7]),
    )
  })

  test('prevJunction not on current road: no direction constraint', () => {
    // KJ2 is on Karl Johans gate, not Akersgata → no direction established → same as prevJunction=null
    expect(ids(computeAvailableJunctions(J3, KJ2, graph))).toEqual(
      ids([J1, J5, KJ2, KJ7]),
    )
  })

  test('deduplicates junction appearing in multiple roads', () => {
    // J3 also appears in Karl Johans gate graph — should still appear once
    const graphWithDupe = makeGraph({
      Akersgata: [J1, J3, J5],
      'Karl Johans gate': [KJ2, J3, KJ7], // J3 duplicated
    })
    expect(ids(computeAvailableJunctions(J3, null, graphWithDupe))).toEqual(
      ids([J1, J5, KJ2, KJ7]),
    )
  })
})
