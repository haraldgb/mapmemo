export type RouteAddress = {
  label: string
  streetAddress: string
  roadName: string
  lat: number
  lng: number
}

export type SelectedJunction = {
  id: number
  lat: number
  lng: number
  nodeIndex: number
  roadName: string
  connectedRoadNames: string[]
}

export type RouteResult = {
  playerDurationSec: number
  optimalDurationSec: number
  playerPolyline: string
  optimalPolyline: string
  differencePercent: number
}
