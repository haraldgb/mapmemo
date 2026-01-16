// TODO: Quite messy typing, but it works for now.
type TSingleFieldMask = `places.${string}`
const defaultFieldMask: TSingleFieldMask[] = [
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.types',
] as const

type DefaultFieldMask = typeof defaultFieldMask
type PlaceFieldMask = DefaultFieldMask[number]
type PlaceFieldName<T extends PlaceFieldMask> = T extends `places.${infer Field}`
  ? Field & keyof PlaceBase
  : never
type PlaceFieldsFromMask<TMask extends readonly PlaceFieldMask[]> = PlaceFieldName<TMask[number]>

type PlaceBase = {
  displayName: { text: string; languageCode?: string }
  formattedAddress: string
  location: { latitude: number; longitude: number }
  types: string[]
}

type PlaceFromMask<TMask extends readonly PlaceFieldMask[]> = Pick<
  PlaceBase,
  PlaceFieldsFromMask<TMask>
>

export type PlacesTextSearchPlace<TMask extends readonly PlaceFieldMask[] = DefaultFieldMask> =
  PlaceFromMask<TMask>

export type PlacesTextSearchResponse<TMask extends readonly PlaceFieldMask[] = DefaultFieldMask> = {
  places: Array<PlaceFromMask<TMask>>
}

type PlacesTextSearchParams<TMask extends readonly PlaceFieldMask[] = DefaultFieldMask> = {
  apiKey: string
  textQuery: string
  fieldMask?: TMask
  language?: string
  locationBias?: { lat: number; lng: number }
  locationBiasRadiusMeters?: number
  locationRestriction?: { low: { lat: number; lng: number }; high: { lat: number; lng: number } }
  maxResultCount?: number
  region?: string
}

type PlacesTextSearchResult<TMask extends readonly PlaceFieldMask[]> = {
  response: Response
  data: PlacesTextSearchResponse<TMask>
}

export const searchPlacesText = async <TMask extends readonly PlaceFieldMask[] = DefaultFieldMask>({
  apiKey,
  textQuery,
  fieldMask,
  language,
  locationBias,
  locationBiasRadiusMeters,
  locationRestriction,
  maxResultCount,
  region,
}: PlacesTextSearchParams<TMask>): Promise<PlacesTextSearchResult<TMask>> => {
  const resolvedFieldMask = (fieldMask ?? defaultFieldMask) as TMask
  const body: Record<string, unknown> = { textQuery }

  if (language) {
    body.languageCode = language
  }
  if (locationBias) {
    body.locationBias = {
      circle: {
        center: { latitude: locationBias.lat, longitude: locationBias.lng },
        radius: locationBiasRadiusMeters ?? 5000,
      },
    }
  }
  if (locationRestriction) {
    body.locationRestriction = {
      rectangle: {
        low: { latitude: locationRestriction.low.lat, longitude: locationRestriction.low.lng },
        high: { latitude: locationRestriction.high.lat, longitude: locationRestriction.high.lng },
      },
    }
  }
  if (typeof maxResultCount === 'number') {
    body.maxResultCount = maxResultCount
  }
  if (region) {
    body.regionCode = region
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': resolvedFieldMask.join(','),
    },
    body: JSON.stringify(body),
  })

  const data: PlacesTextSearchResponse<TMask> = await response.json()

  return { response, data }
}
