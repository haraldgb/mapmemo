import { AdvancedMarker, APIProvider, Map } from '@vis.gl/react-google-maps'
import { GOOGLE_MAPS_API_KEY } from '../../../.secrets/secrets'

const osloCenter = { lat: 59.91, lng: 10.73 }
const osloCenter2 = { lat: 59.91 + 0.05, lng: 10.73 + 0.05 }

export const MapMemo = () => {
  const apiKey = GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <section style={{ display: 'grid', gap: '12px' }}>
        <header>
          <h1>MapMemo</h1>
          <p>Simple Google Maps render using @vis.gl/react-google-maps.</p>
        </header>
        <div>
          <strong>API key required.</strong> Add `VITE_GOOGLE_MAPS_API_KEY` to your `frontend/.env`,
          then restart the dev server.
        </div>
      </section>
    )
  }

  return (
    <section style={{ display: 'grid', gap: '12px' }}>
      <header>
        <h1>MapMemo</h1>
        <p>Simple Google Maps render using @vis.gl/react-google-maps.</p>
      </header>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={osloCenter}
          defaultZoom={11}
          style={{
            height: '480px',
            width: '100%',
            borderRadius: '12px',
            border: '1px solid #e2e2e2',
          }}
          mapId="test"
        >
          <AdvancedMarker position={osloCenter} title="Oslo Center"></AdvancedMarker>
          <AdvancedMarker position={osloCenter2} title="Oslo Center 2"></AdvancedMarker>
        </Map>
      </APIProvider>
    </section>
  )
}
