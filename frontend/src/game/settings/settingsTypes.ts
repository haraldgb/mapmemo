export type GameMode = 'click' | 'name' | 'route'
export type GameDifficulty = 'beginner' | 'easy' | 'medium' | 'hard'
export type AreaSubMode = 'areaCount' | 'areaPick'

export type GameSettings = {
  mode: GameMode
  difficulty: GameDifficulty
  areaSubMode: AreaSubMode
  areaCount: number
  selectedAreas: string[]
  seed: string
}

export type AreaOption = {
  id: string
  name: string
  count: number
}
