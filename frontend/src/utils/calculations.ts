type LatLng = google.maps.LatLng

/**
 * Extract the outer ring of a polygon-type geometry.
 * For non-polygon types, falls back to collecting all points.
 */
const getOuterRing = (geometry: google.maps.Data.Geometry): LatLng[] | null => {
  if (geometry instanceof google.maps.Data.Polygon) {
    return geometry.getArray()[0].getArray()
  }
  if (geometry instanceof google.maps.Data.MultiPolygon) {
    // Use the first polygon's outer ring (largest polygon is typically first)
    return geometry.getArray()[0].getArray()[0].getArray()
  }
  if (geometry instanceof google.maps.Data.GeometryCollection) {
    for (const item of geometry.getArray()) {
      const ring = getOuterRing(item)
      if (ring) {
        return ring
      }
    }
  }
  return null
}

/**
 * Collect all points from a Google Maps Data Geometry into an array of LatLng objects.
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
 * Calculate the centroid of a polygon ring using the shoelace formula.
 * This gives the true geometric center of the polygon, unaffected by point density.
 */
const getRingCentroid = (ring: LatLng[]): google.maps.LatLngLiteral => {
  let area = 0
  let cx = 0
  let cy = 0

  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    const xi = ring[i].lng()
    const yi = ring[i].lat()
    const xj = ring[j].lng()
    const yj = ring[j].lat()

    const cross = xi * yj - xj * yi
    area += cross
    cx += (xi + xj) * cross
    cy += (yi + yj) * cross
  }

  area /= 2
  cx /= 6 * area
  cy /= 6 * area

  return { lat: cy, lng: cx }
}

/**
 * Get the geometric center of a geometry.
 * For polygons, uses the shoelace centroid formula for an accurate center.
 * For other geometry types, falls back to averaging all points.
 */
export const getGeometryCenter = (
  geometry: google.maps.Data.Geometry,
): google.maps.LatLngLiteral => {
  const ring = getOuterRing(geometry)
  if (ring && ring.length >= 3) {
    return getRingCentroid(ring)
  }

  const points = collectGeometryPoints(geometry)
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
