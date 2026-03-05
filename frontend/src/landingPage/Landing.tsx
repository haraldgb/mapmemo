import { CitiesMarquee } from './CitiesMarquee'
import { GameModeCarousel } from './GameModeCarousel'

export const Landing = () => {
  return (
    <section className={s_outer}>
      <div
        className={s_grid_overlay}
        aria-hidden='true'
      />
      <CitiesMarquee />
      <div className={s_hero}>
        <h1 className={s_headline}>
          Know your city.
          <br />
          <span className={s_headline_accent}>Traverse it quickly.</span>
        </h1>
        <p className={s_subheading}>
          Train your mental map through three game modes — pinpoint
          neighborhoods, name what's highlighted, or navigate between road
          junctions.
        </p>
      </div>
      <div className={s_carousel_wrapper}>
        <GameModeCarousel />
      </div>
    </section>
  )
}

const s_outer =
  'relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f6f1] text-slate-900 shadow-sm'

const s_grid_overlay =
  'pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(100,116,139,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.18)_1px,transparent_1px)] [background-size:48px_48px]'

const s_hero = 'flex flex-col gap-5 px-5 pb-10 pt-5 sm:px-14 sm:pb-12 sm:pt-8'

const s_headline =
  'font-display text-[clamp(1.35rem,6.5vw,4.5rem)] font-extrabold leading-[1.08] tracking-tight text-slate-900'

const s_headline_accent = 'text-purple-700'

const s_subheading = 'max-w-lg text-[15px] leading-relaxed text-slate-500'

const s_carousel_wrapper =
  'relative z-10 flex flex-col gap-4 px-5 pb-10 sm:px-14'
