import { LinkButton } from '../components/LinkButton'

const S_outerContainer =
  'flex flex-1 flex-col justify-center gap-6 rounded-3xl border border-slate-200 bg-white/80 p-10 text-left shadow-sm'
const S_slogan = 'text-3xl font-semibold text-slate-900 sm:text-4xl'
const S_gameDescripton = 'max-w-2xl text-base text-slate-600'

export const Landing = () => {
  return (
    <section className={S_outerContainer}>
      <h1 className={S_slogan}>
        Memorize your city, one neighborhood at a time.
      </h1>
      <p className={S_gameDescripton}>
        MapMemo helps you train your mental map of your city. Jump into the game
        mode to test your knowledge of the layout of Oslo.
      </p>
      <LinkButton
        to='/game?seed=dickbutt'
        label='Try the Game'
      />
    </section>
  )
}
