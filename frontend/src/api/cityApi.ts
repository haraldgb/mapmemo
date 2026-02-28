import { fetchWithSessionRetry } from './utils'

export type CityListItem = {
  id: number
  name: string
}

export type CityInfo = {
  id: number
  name: string
  minLat: number | null
  minLon: number | null
  maxLat: number | null
  maxLon: number | null
}

export const fetchCities = async (): Promise<CityListItem[]> => {
  const response = await fetchWithSessionRetry('/api/cities', {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch cities')
  }
  return (await response.json()) as CityListItem[]
}

export const fetchCityInfo = async (cityName: string): Promise<CityInfo> => {
  const response = await fetchWithSessionRetry(
    `/api/cities/${encodeURIComponent(cityName)}`,
    {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    },
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch city info for ${cityName}`)
  }
  return (await response.json()) as CityInfo
}
