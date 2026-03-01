import { fetchWithSessionRetry } from './utils'

export type CityListItem = {
  id: number
  name: string
}

export type DefaultAddress = {
  id: number
  label: string
  streetAddress: string
  roadName: string
  lat: number
  lng: number
}

export type CityInfo = {
  id: number
  name: string
  minLat: number | null
  minLon: number | null
  maxLat: number | null
  maxLon: number | null
  defaultAddresses: DefaultAddress[]
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

export const fetchCityInfo = async (cityId: number): Promise<CityInfo> => {
  const response = await fetchWithSessionRetry(`/api/cities/${cityId}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch city info for id ${cityId}`)
  }
  return (await response.json()) as CityInfo
}
