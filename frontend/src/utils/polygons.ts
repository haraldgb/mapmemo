import {
  ID_KEY,
  SUB_AREA_NAME_KEY,
  type OsloGeoJsonPropertyKey,
} from '../game/consts'

type LatLng = google.maps.LatLng

export const getFeatureProperty = (
  feature: google.maps.Data.Feature,
  propertyName: OsloGeoJsonPropertyKey,
): string => {
  if (propertyName === ID_KEY) {
    return String(feature.getProperty(propertyName))
  }
  const rawProperty = feature.getProperty(propertyName)
  if (typeof rawProperty !== 'string') {
    throw new Error(`${propertyName} property is not a string`)
  }

  const property = rawProperty.trim()
  if (property.length === 0) {
    throw new Error(`${propertyName} property is an empty string`)
  }

  return property
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

const createPolygonLabelElement = (label: string, color = '#3f3f3f') => {
  const element = document.createElement('div')
  element.textContent = label
  element.style.color = color
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
  color?: string,
): google.maps.marker.AdvancedMarkerElement => {
  const label = getFeatureProperty(feature, SUB_AREA_NAME_KEY)

  const geometry = feature.getGeometry()
  if (!geometry) {
    throw new Error('No geometry provided in Google Maps Data Feature')
  }

  const center = getPointsCenter(collectGeometryPoints(geometry))
  return new AdvancedMarkerElement({
    position: center,
    map,
    content: createPolygonLabelElement(label, color),
    title: label,
  })
}
