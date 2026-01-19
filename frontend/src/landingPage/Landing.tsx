import { LinkButton } from '../components/LinkButton'

export const Landing = () => {
  return (
    <section className='flex flex-1 flex-col justify-center gap-6 rounded-3xl border border-slate-200 bg-white/80 p-10 text-left shadow-sm'>
      <div className='space-y-3'>
        <p className='text-sm font-semibold uppercase tracking-[0.25em] text-sky-600'>
          MapMemo
        </p>
        <h1 className='text-3xl font-semibold text-slate-900 sm:text-4xl'>
          Memorize your city, one neighborhood at a time.
        </h1>
        <p className='max-w-2xl text-base text-slate-600'>
          MapMemo helps you train your mental map of your city. Jump into the
          game mode to test your knowledge of the layout of Oslo.
        </p>
      </div>
      <LinkButton
        to='/game?seed=8chrseed'
        label='Try the Game'
      />
    </section>
  )
}
