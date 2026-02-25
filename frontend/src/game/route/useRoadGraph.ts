import { useRef } from 'react'
import {
  fetchRoadWithJunctions,
  type RoadInfo,
  type RoadJunction,
} from '../../api/roadData'
import type { SelectedJunction } from './types'

const CITY_NAME = 'Oslo, Norway'

type RoadGraph = {
  fetchRoad: (roadName: string) => Promise<RoadInfo | null>
  getJunctionsForRoad: (roadName: string) => SelectedJunction[]
  isFetchedAsPrimary: (roadName: string) => boolean
  reset: () => void
}

export const useRoadGraph = (): RoadGraph => {
  // useRef: mutable cache across renders, no re-render needed on updates
  const roadCacheRef = useRef<Map<string, RoadInfo>>(new Map())
  const fetchedAsPrimaryRef = useRef<Set<string>>(new Set())

  const fetchRoad = async (roadName: string): Promise<RoadInfo | null> => {
    if (fetchedAsPrimaryRef.current.has(roadName)) {
      return roadCacheRef.current.get(roadName) ?? null
    }

    const response = await fetchRoadWithJunctions(CITY_NAME, roadName)
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
    roadName,
    otherRoadName: junction.connectedRoadNames[0] ?? '',
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

  const reset = () => {
    roadCacheRef.current = new Map()
    fetchedAsPrimaryRef.current = new Set()
  }

  return { fetchRoad, getJunctionsForRoad, isFetchedAsPrimary, reset }
}
