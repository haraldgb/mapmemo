export type RouteAddress = {
  label: string
  streetAddress: string
  roadName: string
  lat: number
  lng: number
}

export type SnappedAddress = RouteAddress & {
  lat: number
  lng: number
  snappedLat: number
  snappedLng: number
}

export type SelectedIntersection = {
  id: number
  lat: number
  lng: number
  roadName: string
  otherRoadName: string
}

export type RouteGameState = {
  startAddress: SnappedAddress | null
  endAddress: SnappedAddress | null
  path: SelectedIntersection[]
  availableIntersections: SelectedIntersection[]
  currentRoadName: string | null
  isLoading: boolean
  isComplete: boolean
  isReady: boolean
  error: string | null
}

export type RouteResult = {
  playerDurationSec: number
  optimalDurationSec: number
  playerPolyline: string
  optimalPolyline: string
  differencePercent: number
}
