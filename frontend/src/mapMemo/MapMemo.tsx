import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps'
import { useCallback, useEffect, useState } from 'react'
import { GOOGLE_MAPS_API_KEY } from '../../../.secrets/secrets'
import { searchPlacesText, type PlacesTextSearchPlace } from '../api/places'

const OSLO_CENTER = { lat: 59.91, lng: 10.73 }

export const MapMemo = () => {
  const [places, setPlaces] = useState<PlacesTextSearchPlace[]>([])

  const runTextSearch = useCallback(
    async function fetchPlaces() {
      await searchPlacesText({
        apiKey: GOOGLE_MAPS_API_KEY,
        textQuery: 'Neighborhoods in Oslo',
        locationBias: OSLO_CENTER,
        locationBiasRadiusMeters: 15000,
        maxResultCount: 50,
        language: 'nb',
        region: 'NO',
      }).then(({ data }) => {
        const neighborhoods = data.places.filter((place) => place.types.includes('neighborhood'))
        setPlaces(neighborhoods)
      })
    },
    [setPlaces],
  )

  useEffect(
    function fetchOnMount() {
      if (places.length > 0) return
      runTextSearch()
    },
    [runTextSearch, places],
  )

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        defaultCenter={OSLO_CENTER}
        defaultZoom={12}
        style={{
          height: '320px',
          width: '720px',
          borderRadius: '12px',
          border: '1px solid #e2e2e2',
        }}
        mapId="test"
      >
        {places.map((place) => (
          <AdvancedMarker
            key={place.formattedAddress}
            position={{ lat: place.location.latitude, lng: place.location.longitude }}
            title={place.formattedAddress}
          />
        ))}
      </Map>
    </APIProvider>
  )
}
