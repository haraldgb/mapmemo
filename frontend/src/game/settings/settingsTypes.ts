export type GameMode = 'click' | 'name'
export type GameDifficulty = 'easy' | 'medium' | 'hard'

export type GameSettings = {
  mode: GameMode
  difficulty: GameDifficulty
  areaCount: number
  selectedAreas: string[]
  seed: string
}

export type AreaOption = {
  id: string
  name: string
  count: number
}
