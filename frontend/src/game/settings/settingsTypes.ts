export type GameMode = 'click' | 'name'

export type GameSettings = {
  mode: GameMode
  areaCount: number
  selectedAreas: string[]
  seed: string
}

export type AreaOption = {
  id: string
  name: string
  count: number
}
