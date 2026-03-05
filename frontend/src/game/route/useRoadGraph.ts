import { useEffect, useRef } from 'react'
import {
  fetchRoadWithJunctions,
  type RoadInfo,
  type RoadJunction,
} from '../../api/roadData'
import type { SelectedJunction } from './types'

export type RoadGraph = {
  fetchRoad: (roadName: string) => Promise<RoadInfo | null>
  getJunctionsForRoad: (roadName: string) => SelectedJunction[]
  isFetchedAsPrimary: (roadName: string) => boolean
  isInCache: (roadName: string) => boolean
  reset: () => void
}

// Keys are always lowercased so lookups are case-insensitive
const normalizeRoadName = (name: string) => name.toLowerCase()

export const useRoadGraph = (cityId: number): RoadGraph => {
  const normalizedRoadCacheRef = useRef<Map<string, RoadInfo>>(new Map())
  const normalizedFetchedAsPrimaryRef = useRef<Set<string>>(new Set())

  useEffect(
    function resetCacheOnCityChange() {
      normalizedRoadCacheRef.current = new Map()
      normalizedFetchedAsPrimaryRef.current = new Set()
    },
    [cityId],
  )

  const fetchRoad = async (roadName: string): Promise<RoadInfo | null> => {
    if (cityId === 0) {
      return null
    }
    const key = normalizeRoadName(roadName)
    if (normalizedFetchedAsPrimaryRef.current.has(key)) {
      return normalizedRoadCacheRef.current.get(key) ?? null
    }

    const response = await fetchRoadWithJunctions(cityId, roadName)
    // Response is a Record<string, RoadInfo> — primary road + branch roads
    for (const [name, info] of Object.entries(response)) {
      const cacheKey = normalizeRoadName(name)
      if (!normalizedRoadCacheRef.current.has(cacheKey)) {
        normalizedRoadCacheRef.current.set(cacheKey, info)
      }
    }
    normalizedFetchedAsPrimaryRef.current.add(key)
    return normalizedRoadCacheRef.current.get(key) ?? null
  }

  const toSelectedJunction = (
    junction: RoadJunction,
    roadName: string,
  ): SelectedJunction => ({
    id: junction.id,
    lat: junction.lat,
    lng: junction.lng,
    nodeIndex: junction.nodeIndex,
    roadName,
    connectedRoadNames: junction.connectedRoadNames,
  })

  const getJunctionsForRoad = (roadName: string): SelectedJunction[] => {
    const road = normalizedRoadCacheRef.current.get(normalizeRoadName(roadName))
    if (!road) {
      return []
    }
    // Use road.name (OSM canonical) so junction roadName is properly capitalised
    return road.junctions.map((jx) => toSelectedJunction(jx, road.name))
  }

  const isFetchedAsPrimary = (roadName: string): boolean =>
    normalizedFetchedAsPrimaryRef.current.has(normalizeRoadName(roadName))

  const isInCache = (roadName: string): boolean =>
    normalizedRoadCacheRef.current.has(normalizeRoadName(roadName))

  const reset = () => {
    normalizedRoadCacheRef.current = new Map()
    normalizedFetchedAsPrimaryRef.current = new Set()
  }

  return {
    fetchRoad,
    getJunctionsForRoad,
    isFetchedAsPrimary,
    isInCache,
    reset,
  }
}
