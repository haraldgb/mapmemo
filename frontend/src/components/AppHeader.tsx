import { Link } from 'react-router-dom'

export const AppHeader = () => {
  return (
    <header className='border-b border-slate-200 bg-white/80 backdrop-blur'>
      <div className='flex w-full items-center justify-between'>
        <Link
          to='/'
          className='inline-flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100'
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
