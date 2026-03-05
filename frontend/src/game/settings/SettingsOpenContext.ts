import { createContext, useContext } from 'react'

type SettingsOpenContextValue = {
  isSettingsOpen: boolean
  setIsSettingsOpen: (open: boolean) => void
  isInfoOpen: boolean
  setIsInfoOpen: (open: boolean) => void
}

export const SettingsOpenContext = createContext<SettingsOpenContextValue>({
  isSettingsOpen: false,
  setIsSettingsOpen: () => {},
  isInfoOpen: false,
  setIsInfoOpen: () => {},
})

export const useSettingsOpen = (): SettingsOpenContextValue =>
  useContext(SettingsOpenContext)
