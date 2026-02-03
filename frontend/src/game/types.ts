export type GameEntry = {
  id: string
  label: string
  feature: google.maps.Data.Feature
  areaId: string
}

export type RandomGenerator = () => number
