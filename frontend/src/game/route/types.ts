export type RouteAddress = {
  label: string
  streetAddress: string
  roadName: string
  lat: number
  lng: number
}

/** Junction in relation to road or roundabout */
export type RoadJunction = {
  id: number
  lat: number
  lng: number
  wayType: string | null
  connectedRoadNames: string[]
  roundaboutId: number | null
  roadJunctionIndex: number
  roadName: string
}

export type RouteResult = {
  playerDurationSec: number
  optimalDurationSec: number
  playerPolyline: string
  optimalPolyline: string
  differencePercent: number
}
