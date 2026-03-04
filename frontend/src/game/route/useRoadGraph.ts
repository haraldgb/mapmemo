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
const normalize = (name: string) => name.toLowerCase()

export const useRoadGraph = (cityId: number): RoadGraph => {
  // useRef: mutable cache across renders, no re-render needed on updates
  const roadCacheRef = useRef<Map<string, RoadInfo>>(new Map())
  const fetchedAsPrimaryRef = useRef<Set<string>>(new Set())

  useEffect(
    function resetCacheOnCityChange() {
      roadCacheRef.current = new Map()
      fetchedAsPrimaryRef.current = new Set()
    },
    [cityId],
  )

  const fetchRoad = async (roadName: string): Promise<RoadInfo | null> => {
    if (cityId === 0) {
      return null
    }
    const key = normalize(roadName)
    if (fetchedAsPrimaryRef.current.has(key)) {
      return roadCacheRef.current.get(key) ?? null
    }

    const response = await fetchRoadWithJunctions(cityId, roadName)
    // Response is a Record<string, RoadInfo> — primary road + branch roads
    for (const [name, info] of Object.entries(response)) {
      const cacheKey = normalize(name)
      if (!roadCacheRef.current.has(cacheKey)) {
        roadCacheRef.current.set(cacheKey, info)
      }
    }
    fetchedAsPrimaryRef.current.add(key)
    return roadCacheRef.current.get(key) ?? null
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
    const road = roadCacheRef.current.get(normalize(roadName))
    if (!road) {
      return []
    }
    // Use road.name (OSM canonical) so junction roadName is properly capitalised
    return road.junctions.map((jx) => toSelectedJunction(jx, road.name))
  }

  const isFetchedAsPrimary = (roadName: string): boolean =>
    fetchedAsPrimaryRef.current.has(normalize(roadName))

  const isInCache = (roadName: string): boolean =>
    roadCacheRef.current.has(normalize(roadName))

  const reset = () => {
    roadCacheRef.current = new Map()
    fetchedAsPrimaryRef.current = new Set()
  }

  return {
    fetchRoad,
    getJunctionsForRoad,
    isFetchedAsPrimary,
    isInCache,
    reset,
  }
}
