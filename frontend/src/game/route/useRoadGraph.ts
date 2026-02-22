import { useRef } from 'react'
import {
  fetchRoadWithIntersections,
  type RoadInfo,
  type RoadIntersection,
} from '../../api/roadData'
import type { SelectedIntersection } from './types'

const CITY_NAME = 'Oslo, Norway'

type RoadGraph = {
  fetchRoad: (roadName: string) => Promise<RoadInfo | null>
  getIntersectionsForRoad: (roadName: string) => SelectedIntersection[]
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

    const response = await fetchRoadWithIntersections(CITY_NAME, roadName)
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

  const toSelectedIntersection = (
    intersection: RoadIntersection,
    roadName: string,
  ): SelectedIntersection => ({
    id: intersection.id,
    lat: intersection.lat,
    lng: intersection.lng,
    roadName,
    otherRoadName: intersection.otherRoadName,
  })

  const getIntersectionsForRoad = (
    roadName: string,
  ): SelectedIntersection[] => {
    const road = roadCacheRef.current.get(roadName)
    if (!road) {
      return []
    }
    return road.intersections.map((ix) => toSelectedIntersection(ix, roadName))
  }

  const isFetchedAsPrimary = (roadName: string): boolean =>
    fetchedAsPrimaryRef.current.has(roadName)

  const reset = () => {
    roadCacheRef.current = new Map()
    fetchedAsPrimaryRef.current = new Set()
  }

  return { fetchRoad, getIntersectionsForRoad, isFetchedAsPrimary, reset }
}
