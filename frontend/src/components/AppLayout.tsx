import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Route, Routes, useLocation } from 'react-router-dom'
import type { AppDispatch } from '../store'
import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import { Game } from '../game/Game'
import { Landing } from '../landingPage/Landing'
import { mapmemoActions } from '../duck/reducer'
import { ALLOWED_PATHS } from '../utils/allowedPaths'

export const AppLayout = () => {
  const dispatch = useDispatch<AppDispatch>()
  const appVersion = 'N/A'
  const location = useLocation()
  const isGameRoute = location.pathname === '/game'

  useEffect(
    function initializeAppEffect() {
      dispatch(mapmemoActions.initializeApp())
    },
    [dispatch],
  )

  return (
    <div className={s_outer_container}>
      <AppHeader />

      <main className={sf_body(isGameRoute)}>
        <Routes>
          <Route
            path={ALLOWED_PATHS.landing}
            element={<Landing />}
          />
          <Route
            path={ALLOWED_PATHS.game}
            element={<Game />}
          />
        </Routes>
      </main>

      <AppFooter version={appVersion} />
    </div>
  )
}

const s_outer_container = 'flex min-h-screen flex-col bg-slate-50'
const sf_body = (isGameRoute: boolean) =>
  `${isGameRoute ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden' : 'mx-auto flex w-full max-w6xl flex-1 flex-col px-6 py-8'}`
