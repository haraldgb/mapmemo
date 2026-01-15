import { configureStore } from '@reduxjs/toolkit'
import { mapmemoReducer } from '../duck/reducer'

export const store = configureStore({
  reducer: {
    mapmemo: mapmemoReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
