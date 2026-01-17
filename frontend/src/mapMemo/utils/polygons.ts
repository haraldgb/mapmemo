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

const getPolygonStyle = (feature: google.maps.Data.Feature): PolygonStyle => {
  const rawId = feature.getProperty('DELBYDELSN')
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

const getFeatureLabel = (feature: google.maps.Data.Feature): string | null => {
  const rawLabel = feature.getProperty('DELBYDELSN')
  if (typeof rawLabel !== 'string') {
    return null
  }
  const label = rawLabel.trim()
  return label.length > 0 ? label : null
}

const collectGeometryPoints = (geometry: google.maps.Data.Geometry): LatLng[] => {
  if (geometry instanceof google.maps.Data.Point) {
    return [geometry.get()]
  }
  if (geometry instanceof google.maps.Data.MultiPoint) {
    return geometry.getArray()
  }
  if (geometry instanceof google.maps.Data.LineString) {
    return geometry.getArray()
  }
  if (geometry instanceof google.maps.Data.MultiLineString) {
    return geometry.getArray().flatMap((line) => line.getArray())
  }
  if (geometry instanceof google.maps.Data.Polygon) {
    return geometry.getArray().flatMap((path) => path.getArray())
  }
  if (geometry instanceof google.maps.Data.MultiPolygon) {
    return geometry
      .getArray()
      .flatMap((polygon) => polygon.getArray().flatMap((path) => path.getArray()))
  }
  if (geometry instanceof google.maps.Data.GeometryCollection) {
    return geometry.getArray().flatMap((item) => collectGeometryPoints(item))
  }
  return []
}

const getPointsCenter = (points: LatLng[]): google.maps.LatLngLiteral | null => {
  if (points.length === 0) {
    return null
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

const addPolygonLabels = (
  map: google.maps.Map,
  features: google.maps.Data.Feature[],
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement,
): google.maps.marker.AdvancedMarkerElement[] => {
  const markers: google.maps.marker.AdvancedMarkerElement[] = []
  features.forEach((feature) => {
    const label = getFeatureLabel(feature)
    if (!label) {
      return
    }
    const geometry = feature.getGeometry()
    if (!geometry) {
      return
    }
    const center = getPointsCenter(collectGeometryPoints(geometry))
    if (!center) {
      return
    }
    const marker = new AdvancedMarkerElement({
      position: center,
      map,
      content: createPolygonLabelElement(label),
      title: label,
    })
    markers.push(marker)
  })
  return markers
}

type PolygonLayerOptions = {
  url?: string
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

const getGeoJsonType = (geojson: GeoJsonObject): "EPSG:3857" | "unknown" => {
  const crsName = geojson.crs?.properties?.name ?? ''
  return crsName.toUpperCase().includes('EPSG:3857') ? 'EPSG:3857' : 'unknown'
}

const mercatorToLatLng = (x: number, y: number) => {
  const originShift = 20037508.34
  const lon = (x / originShift) * 180
  const lat = (Math.atan(Math.exp((y / originShift) * Math.PI)) * 2 - Math.PI / 2) * (180 / Math.PI)
  return [lon, lat]
}

const convertGeoJsonToLatLng = (geojson: GeoJsonObject) => {
  let convertedPoints = 0
  const visitCoords = (coords: unknown): unknown => {
    if (!Array.isArray(coords)) {
      return coords
    }
    if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      convertedPoints += 1
      return mercatorToLatLng(coords[0], coords[1])
    }
    return coords.map(visitCoords)
  }

  if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
    geojson.features = geojson.features.map((feature) => {
      const geometry = (feature as { geometry?: { coordinates?: unknown } }).geometry
      if (geometry?.coordinates) {
        geometry.coordinates = visitCoords(geometry.coordinates)
      }
      return feature
    })
  } else if (geojson.type === 'Feature') {
    const geometry = (geojson as { geometry?: { coordinates?: unknown } }).geometry
    if (geometry?.coordinates) {
      geometry.coordinates = visitCoords(geometry.coordinates)
    }
  } else if ((geojson as { coordinates?: unknown }).coordinates) {
    geojson = {
      ...geojson,
      coordinates: visitCoords((geojson as { coordinates?: unknown }).coordinates),
    }
  }

  return { geojson, convertedPoints }
}

export const addGeoJsonPolygons = async (
  map: google.maps.Map,
  options: PolygonLayerOptions = {},
) => {
  const controller = new AbortController()
  let addedFeatures: google.maps.Data.Feature[] = []
  let labelMarkers: google.maps.marker.AdvancedMarkerElement[] = []

  const cleanup = () => {
    controller.abort()
    addedFeatures.forEach((feature) => {
      map.data.remove(feature)
    })
    addedFeatures = []
    labelMarkers.forEach((marker) => {
      marker.map = null
    })
    labelMarkers = []
  }

  const url = options.url ?? '/Delbydeler_1854838652447253595.geojson'

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
    map.data.setStyle(getPolygonStyle)
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      'marker',
    )) as google.maps.MarkerLibrary
    labelMarkers = addPolygonLabels(map, addedFeatures, AdvancedMarkerElement)
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return cleanup
    }
  }

  return cleanup
}
