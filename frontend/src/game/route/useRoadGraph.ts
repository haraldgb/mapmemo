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

export const useRoadGraph = (cityName: string): RoadGraph => {
  // useRef: mutable cache across renders, no re-render needed on updates
  const roadCacheRef = useRef<Map<string, RoadInfo>>(new Map())
  const fetchedAsPrimaryRef = useRef<Set<string>>(new Set())

  useEffect(
    function resetCacheOnCityChange() {
      roadCacheRef.current = new Map()
      fetchedAsPrimaryRef.current = new Set()
    },
    [cityName],
  )

  const fetchRoad = async (roadName: string): Promise<RoadInfo | null> => {
    if (fetchedAsPrimaryRef.current.has(roadName)) {
      return roadCacheRef.current.get(roadName) ?? null
    }

    const response = await fetchRoadWithJunctions(cityName, roadName)
    // Response is a Record<string, RoadInfo> — primary road + branch roads
    for (const [name, info] of Object.entries(response)) {
      const existing = roadCacheRef.current.get(name)
      if (!existing) {
        roadCacheRef.current.set(name, info)
      }
    }
    fetchedAsPrimaryRef.current.add(roadName)
    return roadCacheRef.current.get(roadName) ?? null
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
    const road = roadCacheRef.current.get(roadName)
    if (!road) {
      return []
    }
    return road.junctions.map((jx) => toSelectedJunction(jx, roadName))
  }

  const isFetchedAsPrimary = (roadName: string): boolean =>
    fetchedAsPrimaryRef.current.has(roadName)

  const isInCache = (roadName: string): boolean =>
    roadCacheRef.current.has(roadName)

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
