export type GameEntry = {
  id: string
  label: string
  feature: google.maps.Data.Feature
  areaId: string
}

export type GuessOutcome = {
  isCorrect: boolean
  entryId: string
  clickedFeature: google.maps.Data.Feature | null
}

export type RandomGenerator = () => number

export type MapContext = {
  map: google.maps.Map
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement
} | null
