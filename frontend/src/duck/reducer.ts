import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { BydelOption, GameSettings } from '../game/settings/settingsTypes'
import { DEFAULT_GAME_SETTINGS } from '../game/consts'

export interface MapmemoState {
  gameSettings: GameSettings
  bydelOptions: BydelOption[]
  isAppInitialized: boolean
}

export const initialMapmemoState: MapmemoState = {
  gameSettings: DEFAULT_GAME_SETTINGS,
  bydelOptions: [],
  isAppInitialized: false,
}

const mapmemoSlice = createSlice({
  name: 'mapmemo',
  initialState: initialMapmemoState,
  reducers: {
    setGameSettings(state, action: PayloadAction<GameSettings>) {
      state.gameSettings = action.payload
    },
    setBydelOptions(state, action: PayloadAction<BydelOption[]>) {
      state.bydelOptions = action.payload
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
