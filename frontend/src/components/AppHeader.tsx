import { Link } from 'react-router-dom'
import { useSettingsOpen } from '../game/settings/SettingsOpenContext'

interface AppHeaderProps {
  isGameRoute: boolean
}

export const AppHeader = ({ isGameRoute }: AppHeaderProps) => {
  const { isSettingsOpen } = useSettingsOpen()
  const isVisible = !isGameRoute || isSettingsOpen

  return (
    <header className={sf_header(isGameRoute, isVisible)}>
      <div className={s_header_inner}>
        <Link
          to='/'
          className={s_home_link}
        >
          <img
            src='/mapmemo-logo.svg'
            alt='MapMemo logo'
            className='h-6 w-6'
          />
          <span>MapMemo</span>
        </Link>
      </div>
    </header>
  )
}

const sf_header = (isGameRoute: boolean, isVisible: boolean) => {
  const base =
    'border-b border-slate-200 bg-white transition-all duration-300 ease-in-out'
  if (!isGameRoute) {
    return base
  }
  const gamePosition = `absolute inset-x-0 top-0 z-40`
  const visibility = isVisible
    ? 'translate-y-0 opacity-100'
    : '-translate-y-full opacity-0 pointer-events-none'
  return `${base} ${gamePosition} ${visibility}`
}
const s_header_inner = 'flex w-full items-center justify-between'
const s_home_link =
  'inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-100'
