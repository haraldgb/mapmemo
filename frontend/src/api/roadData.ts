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

const ROADS_BY_NAME_URL = '/api/roads'

export const fetchRoadWithJunctions = async (
  cityName: string,
  roadName: string,
): Promise<RoadWithJunctionsResponse> => {
  const url = `${ROADS_BY_NAME_URL}?city_name=${encodeURIComponent(cityName)}&road_name=${encodeURIComponent(roadName)}`
  const response = await fetchWithSessionRetry(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch road with junctions')
  }
  const data = (await response.json()) as RoadWithJunctionsResponse
  return data
}
