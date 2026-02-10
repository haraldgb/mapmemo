import { fetchWithSessionRetry } from '../game/hooks/useFeaturesInPlay'

export type RoadIntersection = {
  id: number
  lat: number
  lng: number
  wayType: string | null
  otherRoadName: string
}

export type RoadInfo = {
  id: number
  name: string
  cityId: number
  intersections: RoadIntersection[]
}

export type RoadWithIntersectionsResponse = Record<string, RoadInfo>

const ROADS_BY_NAME_URL = '/api/roads'

export const fetchRoadWithIntersections = async (
  cityName: string,
  roadName: string,
): Promise<RoadWithIntersectionsResponse> => {
  const url = `${ROADS_BY_NAME_URL}?city_name=${encodeURIComponent(cityName)}&road_name=${encodeURIComponent(roadName)}`
  const response = await fetchWithSessionRetry(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch road with intersections')
  }
  const data = (await response.json()) as RoadWithIntersectionsResponse
  return data
}
