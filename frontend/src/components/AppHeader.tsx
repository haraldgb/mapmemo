import { Link } from 'react-router-dom'

export const AppHeader = () => {
  return (
    <header className={s_header}>
      <div className={s_header_inner}>
        <Link
          to='/'
          className={s_home_link}
        >
          <img
            src='/mapmemo-logo.svg'
            alt='MapMemo logo'
            className='h-8 w-8'
          />
          <span>MapMemo</span>
        </Link>
      </div>
    </header>
  )
}

const s_header = 'border-b border-slate-200 bg-white/80 backdrop-blur'
const s_header_inner = 'flex w-full items-center justify-between'
const s_home_link =
  'inline-flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100'
