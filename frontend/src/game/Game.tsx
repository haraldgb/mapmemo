import { useSelector } from 'react-redux'
import type { RootState } from '../store'
import { AreaGame } from './AreaGame.tsx'
import { RouteGame } from './route/RouteGame.tsx'

export const Game = () => {
  const mode = useSelector(
    (state: RootState) => state.mapmemo.gameSettings.mode,
  )

  if (mode === 'route') {
    return <RouteGame />
  }

  return <AreaGame />
}
