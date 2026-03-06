import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { AreaGame } from './AreaGame.tsx'
import { RouteGame } from './route/RouteGame.tsx'
import { GoogleMapsProvider } from '../components/GoogleMapsProvider.tsx'

export const Game = () => {
  const mode = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.mode,
  )

  return (
    <GoogleMapsProvider>
      {mode === 'route' ? <RouteGame /> : <AreaGame />}
    </GoogleMapsProvider>
  )
}
