import { GameModeCarousel } from './GameModeCarousel'

export const Landing = () => {
  return (
    <section className={s_outer_container}>
      <h1 className={s_slogan}>
        Memorize your city, one neighborhood at a time.
      </h1>
      <p className={s_game_descripton}>
        MapMemo helps you train your mental map of your city. Jump into the game
        mode to test your knowledge of the layout of Oslo.
      </p>
      <GameModeCarousel />
    </section>
  )
}

const s_outer_container =
  'flex flex-1 flex-col justify-center gap-6 rounded-3xl border border-slate-200 bg-white/80 p-10 text-left shadow-sm'
const s_slogan = 'text-3xl font-semibold text-slate-900 sm:text-4xl'
const s_game_descripton = 'max-w-2xl text-base text-slate-600'
