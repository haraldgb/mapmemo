import { fetchWithSessionRetry } from './utils'

export type RoadJunction = {
  id: number
  lat: number
  lng: number
  wayType: string | null
  nodeIndex: number
  connectedRoadNames: string[]
  roundaboutId: number | null
}

export type RoadInfo = {
  id: number
  name: string
  cityId: number
  junctions: RoadJunction[]
}

export type RoadWithJunctionsResponse = Record<string, RoadInfo>

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
): Promise<RoadWithJunctionsResponse> => {
  const url = `${ROADS_URL}?city_id=${cityId}&road_name=${encodeURIComponent(roadName)}`
  const response = await fetchWithSessionRetry(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch road with junctions')
  }
  return (await response.json()) as RoadWithJunctionsResponse
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
