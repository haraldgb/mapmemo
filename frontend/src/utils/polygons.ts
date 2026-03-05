import {
  ID_KEY,
  SUB_AREA_NAME_KEY,
  type OsloGeoJsonPropertyKey,
} from '../game/consts'
import { getGeometryCenter } from './calculations'

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

const createPolygonLabelElement = (label: string, color = '#3f3f3f') => {
  const element = document.createElement('div')
  element.textContent = label
  element.style.color = color
  element.style.fontSize = '14px'
  element.style.fontWeight = '500'
  element.style.whiteSpace = 'nowrap'
  element.style.textShadow = '0 0 4px rgba(255, 255, 255, 0.9)'
  element.style.transform = 'translateY(50%)'
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

  const center = getGeometryCenter(geometry)
  return new AdvancedMarkerElement({
    position: center,
    map,
    content: createPolygonLabelElement(label, color),
    title: label,
  })
}
