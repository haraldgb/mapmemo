import { useSettingsOpen } from '../game/settings/SettingsOpenContext'

interface AppFooterProps {
  version: string
  isGameRoute: boolean
}

export const AppFooter = ({ version, isGameRoute }: AppFooterProps) => {
  const { isSettingsOpen } = useSettingsOpen()
  const isVisible = !isGameRoute || isSettingsOpen

  return (
    <footer className={sf_footer(isGameRoute, isVisible)}>
      <div className={s_footer_inner}>
        <span>Version {version}</span>
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
    </footer>
  )
}

const sf_footer = (isGameRoute: boolean, isVisible: boolean) => {
  const base =
    'border-t border-slate-200 bg-white transition-all duration-300 ease-in-out'
  if (!isGameRoute) {
    return base
  }
  const gamePosition = 'absolute inset-x-0 bottom-0 z-20'
  const visibility = isVisible
    ? '[clip-path:inset(0)] opacity-100'
    : '[clip-path:inset(100%_0_0_0)] opacity-0 pointer-events-none'
  return `${base} ${gamePosition} ${visibility}`
}
const s_footer_inner =
  'flex w-full flex-col gap-1 px-4 py-1.5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between'
const s_repo_link =
  'inline-flex items-center gap-1.5 text-slate-500 transition hover:text-slate-900'
