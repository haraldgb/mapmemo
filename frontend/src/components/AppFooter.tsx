import { Link } from 'react-router-dom'
import { useSettingsOpen } from '../game/settings/SettingsOpenContext'

interface AppFooterProps {
  version: string
  isGameRoute: boolean
}

export const AppFooter = ({ version, isGameRoute }: AppFooterProps) => {
  const { isSettingsOpen, isInfoOpen } = useSettingsOpen()
  const isVisible = !isGameRoute || isSettingsOpen || isInfoOpen

  return (
    <footer className={sf_footer(isGameRoute, isVisible)}>
      <div className={s_footer_inner}>
        <span className={s_version}>{version}</span>
        <div className={s_footer_links}>
          <Link
            to='/privacy'
            className={s_repo_link}
          >
            Privacy
          </Link>
          <a
            href='https://github.com/haraldgb/mapmemo'
            className={s_repo_link}
            rel='noreferrer'
            target='_blank'
          >
            <svg
              aria-hidden='true'
              viewBox='0 0 24 24'
              className='h-3.5 w-3.5'
              fill='currentColor'
            >
              <use href='/github-mark.svg#github-mark' />
            </svg>
            haraldgb/mapmemo
          </a>
        </div>
      </div>
    </footer>
  )
}

const sf_footer = (isGameRoute: boolean, isVisible: boolean) => {
  if (!isGameRoute) {
    return 'border-t border-slate-200 bg-white transition-all duration-300 ease-in-out'
  }
  const gameBase =
    'border-t border-slate-200 bg-white transition-all duration-300 ease-in-out'
  const gamePosition = 'fixed inset-x-0 bottom-0 z-40'
  const visibility = isVisible
    ? 'translate-y-0 opacity-100'
    : 'translate-y-full opacity-0 pointer-events-none'
  return `${gameBase} ${gamePosition} ${visibility}`
}
const s_footer_inner =
  'flex flex-row w-full gap-1 px-4 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] text-xs text-slate-500 sm:items-center justify-between'
const s_version = 'text-slate-500 cursor-default'
const s_footer_links = 'flex items-center gap-4'
const s_repo_link =
  'inline-flex items-center gap-1.5 text-slate-500 transition hover:text-slate-900'
