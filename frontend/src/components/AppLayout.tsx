import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Route, Routes, useLocation } from 'react-router-dom'
import type { AppDispatch } from '../store'
import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import { Game } from '../game/Game'
import { Landing } from '../landingPage/Landing'
import { Privacy } from '../privacyPage/Privacy'
import { mapmemoActions } from '../duck/reducer'
import { SettingsOpenContext } from '../game/settings/SettingsOpenContext'

export const AppLayout = () => {
  const dispatch = useDispatch<AppDispatch>()
  const appVersion = 'N/A'
  const location = useLocation()
  const isGameRoute = location.pathname === '/game'

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const settingsContextValue = useMemo(
    function buildSettingsContext() {
      return { isSettingsOpen, setIsSettingsOpen, isInfoOpen, setIsInfoOpen }
    },
    [isSettingsOpen, isInfoOpen],
  )

  useEffect(
    function initializeAppEffect() {
      dispatch(mapmemoActions.initializeApp())
    },
    [dispatch],
  )

  return (
    <SettingsOpenContext value={settingsContextValue}>
      <div className={sf_outer_container(isGameRoute)}>
        <AppHeader isGameRoute={isGameRoute} />

        <main className={sf_body(isGameRoute)}>
          <Routes>
            <Route
              path='/'
              element={<Landing />}
            />
            <Route
              path='/game'
              element={<Game />}
            />
            <Route
              path='/privacy'
              element={<Privacy />}
            />
          </Routes>
        </main>

        <AppFooter
          version={appVersion}
          isGameRoute={isGameRoute}
        />
      </div>
    </SettingsOpenContext>
  )
}

const sf_outer_container = (isGameRoute: boolean) =>
  isGameRoute
    ? 'flex h-screen flex-col bg-slate-50'
    : 'flex min-h-screen flex-col bg-slate-50'
const sf_body = (isGameRoute: boolean) =>
  `${isGameRoute ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden' : 'mx-auto flex w-full max-w6xl flex-1 flex-col px-6 py-8'}`
