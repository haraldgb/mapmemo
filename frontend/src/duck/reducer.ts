import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface MapmemoState {
  message: string
}

const initialState: MapmemoState = {
  message: 'Welcome to mapmemo!',
}

const mapmemoSlice = createSlice({
  name: 'mapmemo',
  initialState,
  reducers: {
    setMessage(state, action: PayloadAction<string>) {
      state.message = action.payload
    },
    resetMessage(state) {
      state.message = initialState.message
    },
  },
})

export const mapmemoReducer = mapmemoSlice.reducer
export const mapmemoActions = mapmemoSlice.actions
