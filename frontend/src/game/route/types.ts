export type RouteAddress = {
  label: string
  streetAddress: string
  roadName: string
  lat: number
  lng: number
}

export type SelectedIntersection = {
  id: number
  lat: number
  lng: number
  roadName: string
  otherRoadName: string
}

export type RouteResult = {
  playerDurationSec: number
  optimalDurationSec: number
  playerPolyline: string
  optimalPolyline: string
  differencePercent: number
}
