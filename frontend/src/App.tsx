import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AppFooter } from './components/AppFooter'
import { AppHeader } from './components/AppHeader'
import { Game } from './game/Game'
import { Landing } from './landingPage/Landing'

const AppLayout = () => {
  const appVersion = 'N/A'
  const location = useLocation()
  const isGameRoute = location.pathname === '/game'

  return (
    <div className='flex min-h-screen flex-col bg-slate-50'>
      <AppHeader />

      <main
        className={
          // TODO: These styling configurations should live somewhere else, but ok for now.
          isGameRoute
            ? 'flex min-h-0 w-full flex-1 flex-col overflow-hidden'
            : 'mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8'
        }
      >
        <Routes>
          <Route
            path='/'
            element={<Landing />}
          />
          <Route
            path='/game'
            element={<Game />}
          />
        </Routes>
      </main>

      <AppFooter version={appVersion} />
    </div>
  )
}

export const App = () => {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
