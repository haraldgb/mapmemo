type AppFooterProps = {
  version: string
}

export const AppFooter = ({ version }: AppFooterProps) => {
  return (
    <footer className={s_footer}>
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
            className='h-4 w-4'
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

const s_footer = 'border-t border-slate-200 bg-white/80'
const s_footer_inner =
  'flex w-full flex-col gap-2 px-6 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between'
const s_repo_link =
  'inline-flex items-center gap-2 text-slate-500 transition hover:text-slate-900'
