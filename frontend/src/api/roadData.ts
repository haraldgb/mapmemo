import { fetchWithSessionRetry } from './utils'

export type RoadJunctionRef = {
  junctionId: number
  roadJunctionIndex: number
}

export type Junction = {
  id: number
  lat: number
  lng: number
  wayType: string | null
  connectedRoadNames: string[]
  roundaboutId: number | null
}

export type RoadInfo = {
  id: number
  name: string
  cityId: number
  junctions: RoadJunctionRef[]
}

export type RoadsResponse = {
  roads: Record<string, RoadInfo>
  junctions: Record<string, Junction>
}

export type RoadSuggestion = {
  name: string
  score: number
}

export type CheckRoadResponse = {
  found: boolean
  canonicalName: string | null
  suggestions: RoadSuggestion[]
}

const ROADS_URL = '/api/roads'

export const fetchRoadWithJunctions = async (
  cityId: number,
  roadName: string,
): Promise<RoadsResponse> => {
  const url = `${ROADS_URL}?city_id=${cityId}&road_name=${encodeURIComponent(roadName)}`
  const response = await fetchWithSessionRetry(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch road with junctions')
  }
  return (await response.json()) as RoadsResponse
}

export const checkRoad = async (
  cityId: number,
  roadName: string,
): Promise<CheckRoadResponse> => {
  const url = `${ROADS_URL}/check?city_id=${cityId}&road_name=${encodeURIComponent(roadName)}`
  const response = await fetchWithSessionRetry(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to check road')
  }
  return (await response.json()) as CheckRoadResponse
}
