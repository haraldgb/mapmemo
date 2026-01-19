import { SUB_DISTRICT_KEY } from '../../game/consts'

type PolygonStyle = {
  strokeColor: string
  strokeOpacity: number
  strokeWeight: number
  fillColor: string
  fillOpacity: number
}

const DEFAULT_POLYGON_STYLE: PolygonStyle = {
  strokeColor: '#1f6fbf',
  strokeOpacity: 0.8,
  strokeWeight: 1.5,
  fillColor: '#1f6fbf',
  fillOpacity: 0.2,
}

const hashStringToColor = (value: string): string => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 50%)`
}

const getPolygonStylingFunction = (
  feature: google.maps.Data.Feature,
): PolygonStyle => {
  const rawId = feature.getProperty(SUB_DISTRICT_KEY)
  if (typeof rawId !== 'string' || rawId.trim() === '') {
    return DEFAULT_POLYGON_STYLE
  }
  const color = hashStringToColor(rawId)
  return {
    strokeColor: color,
    strokeOpacity: 0.8,
    strokeWeight: 1.5,
    fillColor: color,
    fillOpacity: 0.25,
  }
}

type LatLng = google.maps.LatLng

export const getFeatureLabel = (
  feature: google.maps.Data.Feature,
  labelProperty: string,
): string => {
  const rawLabel = feature.getProperty(labelProperty)
  if (typeof rawLabel !== 'string') {
    throw new Error(`${labelProperty} property is not a string`)
  }

  const label = rawLabel.trim()
  if (label.length === 0) {
    throw new Error(`${labelProperty} property is an empty string`)
  }

  return label
}

/**
 * Collect all points from a Google Maps Data Geometry into an array of LatLng objects.
 * @param geometry
 * @returns
 */
const collectGeometryPoints = (
  geometry: google.maps.Data.Geometry,
): LatLng[] => {
  switch (true) {
    case geometry instanceof google.maps.Data.Point:
      return [geometry.get()]
    case geometry instanceof google.maps.Data.MultiPoint:
      return geometry.getArray()
    case geometry instanceof google.maps.Data.LineString:
      return geometry.getArray()
    case geometry instanceof google.maps.Data.MultiLineString:
      return geometry.getArray().flatMap((line) => line.getArray())
    case geometry instanceof google.maps.Data.Polygon:
      return geometry.getArray().flatMap((path) => path.getArray())
    case geometry instanceof google.maps.Data.MultiPolygon:
      return geometry
        .getArray()
        .flatMap((polygon) =>
          polygon.getArray().flatMap((path) => path.getArray()),
        )
    case geometry instanceof google.maps.Data.GeometryCollection:
      return geometry.getArray().flatMap((item) => collectGeometryPoints(item))
    default:
      throw new Error('Unknown geometry type')
  }
}

/**
 * Simple calculation average of height and width of the points.
 * An uneven distribution of points will result in a center shifted to the side with more points.
 * @param points
 * @returns
 */
const getPointsCenter = (points: LatLng[]): google.maps.LatLngLiteral => {
  if (points.length === 0) {
    throw new Error('No points provided')
  }
  const total = points.reduce(
    (acc, point) => {
      acc.lat += point.lat()
      acc.lng += point.lng()
      return acc
    },
    { lat: 0, lng: 0 },
  )
  return {
    lat: total.lat / points.length,
    lng: total.lng / points.length,
  }
}

const createPolygonLabelElement = (label: string) => {
  const element = document.createElement('div')
  element.textContent = label
  element.style.color = '#3f3f3f'
  element.style.fontSize = '14px'
  element.style.fontWeight = '500'
  element.style.whiteSpace = 'nowrap'
  element.style.textShadow = '0 0 4px rgba(255, 255, 255, 0.9)'
  return element
}

export const createPolygonLabelMarker = (
  map: google.maps.Map,
  feature: google.maps.Data.Feature,
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement,
): google.maps.marker.AdvancedMarkerElement => {
  const label = getFeatureLabel(feature, SUB_DISTRICT_KEY)

  const geometry = feature.getGeometry()
  if (!geometry) {
    throw new Error('No geometry provided in Google Maps Data Feature')
  }

  const center = getPointsCenter(collectGeometryPoints(geometry))
  return new AdvancedMarkerElement({
    position: center,
    map,
    content: createPolygonLabelElement(label),
    title: label,
  })
}

type PolygonLayerOptions = {
  url: string
  style?: (feature: google.maps.Data.Feature) => google.maps.Data.StyleOptions
  onLoaded?: (payload: {
    features: google.maps.Data.Feature[]
    map: google.maps.Map
  }) => void | Promise<void>
  onFeatureClick?: (
    feature: google.maps.Data.Feature,
    event: google.maps.Data.MouseEvent,
  ) => void
  onFeatureHover?: (
    feature: google.maps.Data.Feature,
    isHovering: boolean,
    event: google.maps.Data.MouseEvent,
  ) => void
}

type GeoJsonObject = {
  type: string
  features?: unknown[]
  crs?: {
    type?: string
    properties?: {
      name?: string
    }
  }
  [key: string]: unknown
}

const getGeoJsonType = (geojson: GeoJsonObject): 'EPSG:3857' | 'unknown' => {
  const crsName = geojson.crs?.properties?.name ?? ''
  return crsName.toUpperCase().includes('EPSG:3857') ? 'EPSG:3857' : 'unknown'
}

const mercatorToLatLng = (x: number, y: number) => {
  const originShift = 20037508.34
  const lon = (x / originShift) * 180
  const lat =
    (Math.atan(Math.exp((y / originShift) * Math.PI)) * 2 - Math.PI / 2) *
    (180 / Math.PI)
  return [lon, lat]
}

const convertGeoJsonToLatLng = (geojson: GeoJsonObject) => {
  let convertedPoints = 0
  const visitCoords = (coords: unknown): unknown => {
    if (!Array.isArray(coords)) {
      return coords
    }
    if (
      coords.length === 2 &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number'
    ) {
      convertedPoints += 1
      return mercatorToLatLng(coords[0], coords[1])
    }
    return coords.map(visitCoords)
  }

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    geojson.features = geojson.features.map((feature) => {
      const geometry = (feature as { geometry?: { coordinates?: unknown } })
        .geometry
      if (geometry?.coordinates) {
        geometry.coordinates = visitCoords(geometry.coordinates)
      }
      return feature
    })
  } else if (geojson.type === 'Feature') {
    const geometry = (geojson as { geometry?: { coordinates?: unknown } })
      .geometry
    if (geometry?.coordinates) {
      geometry.coordinates = visitCoords(geometry.coordinates)
    }
  } else if ((geojson as { coordinates?: unknown }).coordinates) {
    geojson = {
      ...geojson,
      coordinates: visitCoords(
        (geojson as { coordinates?: unknown }).coordinates,
      ),
    }
  }

  return { geojson, convertedPoints }
}

/**
 * Add GeoJSON polygons to a Google Maps map.
 * @param map
 * @param options
 * @returns cleanup function
 */
export const addGeoJsonPolygons = async (
  map: google.maps.Map,
  options: PolygonLayerOptions,
) => {
  const controller = new AbortController()
  let addedFeatures: google.maps.Data.Feature[] = []
  let labelMarkers: google.maps.marker.AdvancedMarkerElement[] = []
  const listeners: google.maps.MapsEventListener[] = []

  const cleanup = () => {
    controller.abort()
    listeners.forEach((listener) => listener.remove())
    addedFeatures.forEach((feature) => {
      map.data.remove(feature)
    })
    addedFeatures = []
    labelMarkers.forEach((marker) => {
      marker.map = null
    })
    labelMarkers = []
  }

  const url = options.url

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      return cleanup
    }
    let geojson = (await response.json()) as GeoJsonObject
    if (getGeoJsonType(geojson) === 'EPSG:3857') {
      const conversion = convertGeoJsonToLatLng(geojson)
      geojson = conversion.geojson
    }
    addedFeatures = map.data.addGeoJson(geojson)
    const stylingFunction = options.style ?? getPolygonStylingFunction
    map.data.setStyle(stylingFunction)
    if (options.onFeatureClick) {
      listeners.push(
        map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
          if (!event.feature) {
            return
          }
          options.onFeatureClick?.(event.feature, event)
        }),
      )
    }
    if (options.onFeatureHover) {
      listeners.push(
        map.data.addListener(
          'mouseover',
          (event: google.maps.Data.MouseEvent) => {
            if (!event.feature) {
              return
            }
            options.onFeatureHover?.(event.feature, true, event)
          },
        ),
      )
      listeners.push(
        map.data.addListener(
          'mouseout',
          (event: google.maps.Data.MouseEvent) => {
            if (!event.feature) {
              return
            }
            options.onFeatureHover?.(event.feature, false, event)
          },
        ),
      )
    }
    if (options.onLoaded) {
      await options
        .onLoaded({ features: addedFeatures, map })
        ?.then(() => {})
        .catch((error) => {
          throw error
        })
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return cleanup
    }
  }

  return cleanup
}
