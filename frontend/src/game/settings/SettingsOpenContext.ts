import { createContext, useContext } from 'react'

type SettingsOpenContextValue = {
  isSettingsOpen: boolean
  setIsSettingsOpen: (open: boolean) => void
}

export const SettingsOpenContext = createContext<SettingsOpenContextValue>({
  isSettingsOpen: false,
  setIsSettingsOpen: () => {},
})

export const useSettingsOpen = (): SettingsOpenContextValue =>
  useContext(SettingsOpenContext)
