import { Link } from 'react-router-dom'
import { useSettingsOpen } from '../game/settings/SettingsOpenContext'

const REPO = 'https://github.com/haraldgb/mapmemo'

const getVersionInfo = (version: string): { display: string; url: string } => {
  if (/^[0-9a-f]+$/i.test(version)) {
    return { display: `#${version}`, url: `${REPO}/commit/${version}` }
  }
  const offsetMatch = version.match(/^(.+)-\d+-g([0-9a-f]+)$/)
  if (offsetMatch) {
    return { display: version, url: `${REPO}/commit/${offsetMatch[2]}` }
  }
  return { display: version, url: `${REPO}/releases/tag/${version}` }
}

interface AppFooterProps {
  version: string
  isGameRoute: boolean
}

export const AppFooter = ({ version, isGameRoute }: AppFooterProps) => {
  const { isSettingsOpen, isInfoOpen } = useSettingsOpen()
  const isVisible = !isGameRoute || isSettingsOpen || isInfoOpen
  const { display, url } = getVersionInfo(version)

  return (
    <footer className={sf_footer(isGameRoute, isVisible)}>
      <div className={sf_footer_inner(isGameRoute)}>
        <a
          href={url}
          className={sf_repo_link(isGameRoute)}
          rel='noreferrer'
          target='_blank'
        >
          Version {display}
        </a>
        <div className={s_footer_links}>
          <Link
            to='/privacy'
            className={sf_repo_link(isGameRoute)}
          >
            Privacy
          </Link>
          <a
            href='https://github.com/haraldgb/mapmemo'
            className={sf_repo_link(isGameRoute)}
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
  const gamePosition = 'absolute inset-x-0 bottom-0 z-40'
  const visibility = isVisible
    ? '[clip-path:inset(0)] opacity-100'
    : '[clip-path:inset(100%_0_0_0)] opacity-0 pointer-events-none'
  return `${gameBase} ${gamePosition} ${visibility}`
}
const sf_footer_inner = (isGameRoute: boolean) =>
  `flex flex-row w-full gap-1 px-4 py-1.5 text-xs sm:items-center justify-between ${
    isGameRoute ? 'text-slate-500' : 'text-slate-500'
  }`
const s_footer_links = 'flex items-center gap-4'
const sf_repo_link = (isGameRoute: boolean) =>
  isGameRoute
    ? 'inline-flex items-center gap-1.5 text-slate-500 transition hover:text-slate-900'
    : 'inline-flex items-center gap-1.5 text-slate-500 transition hover:text-slate-900'
