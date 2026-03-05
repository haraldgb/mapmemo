# Google Maps Integration

## Stack

- `@vis.gl/react-google-maps` — React wrapper (provides `<Map>`, `useMap`, `useMapsLibrary`)
- `google.maps.Data` API — features rendered as GeoJSON polygons on the data layer (NOT markers or overlays)
- `@types/google.maps` for type safety
- API key loaded at build time (Vite) or via backend `/api/google-maps-key` endpoint

## Key components

### `GoogleMapsProvider` (`src/components/GoogleMapsProvider.tsx`)

Wraps app with `<APIProvider>`. Loaded once at root.

### `GMap` (`src/components/GMap.tsx`)

Core map component. Manages:

- Feature sync: diffing previous vs next features, adding/removing from `map.data`
- Event listeners: click, mouseover, mouseout on data layer features
- Readiness: waits for `tilesloaded` event before rendering children
- Handler refs: uses `useRef` to avoid re-registering listeners on handler changes
- Map ID: `5da3993597ca412079e99b4c` (cloud-styled map)

### Game hooks (`src/game/hooks/`)

- `useFeaturesInPlay` — fetches GeoJSON, builds `google.maps.Data.Feature[]`
- `useGameStyling` — sets feature styles (fill color, stroke) based on game state
- `useFeatureLabels` — manages `AdvancedMarkerElement` labels on features

## Patterns

- Features are `google.maps.Data.Feature` objects — access properties via `feature.getProperty(key)`
- Helper: `getFeatureProperty(feature, key)` in `src/utils/polygons.ts`
- Feature identity: `ID_KEY` property, display name: `SUB_AREA_NAME_KEY`
- Default center: Oslo (59.91, 10.73), zoom 11
- GeoJSON source: backend `/api/oslo-neighboorhoods` endpoint (currently Oslo delbydeler)
