import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AreaOption, GameSettings } from '../game/settings/settingsTypes'
import { AREA_COUNT_OPTIONS } from '../game/consts'
import { randomSeed } from '../game/utils'

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  mode: 'click',
  difficulty: 'easy',
  areaSubMode: 'areaCount',
  areaCount: AREA_COUNT_OPTIONS[0]?.value ?? 10,
  selectedAreas: [],
  seed: randomSeed(),
}
export interface MapmemoState {
  gameSettings: GameSettings
  areaOptions: AreaOption[]
  allSubAreaNames: string[]
  isAppInitialized: boolean
}

export const initialMapmemoState: MapmemoState = {
  gameSettings: DEFAULT_GAME_SETTINGS,
  areaOptions: [],
  allSubAreaNames: [],
  isAppInitialized: false,
}

const mapmemoSlice = createSlice({
  name: 'mapmemo',
  initialState: initialMapmemoState,
  reducers: {
    setGameSettings(state, action: PayloadAction<GameSettings>) {
      state.gameSettings = action.payload
    },
    setAreaOptions(state, action: PayloadAction<AreaOption[]>) {
      state.areaOptions = action.payload
    },
    setAllSubAreaNames(state, action: PayloadAction<string[]>) {
      state.allSubAreaNames = action.payload
    },
    initializeApp(state) {
      state.isAppInitialized = false
    },
    setAppInitialized(state, action: PayloadAction<boolean>) {
      state.isAppInitialized = action.payload
    },
  },
})

export const mapmemoReducer = mapmemoSlice.reducer
export const mapmemoActions = mapmemoSlice.actions
