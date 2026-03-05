import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import type { RootState } from '../store'
import { mapmemoActions } from '../duck/reducer'
import { MODE_DESCRIPTIONS } from '../game/consts'
import type { GameMode } from '../game/settings/settingsTypes'

type GameModeSlide = {
  mode: GameMode
  label: string
  description: string
  // TODO: replace with actual screenshot paths once captured
  imageSrc: string
  imageAlt: string
}

const SLIDES: GameModeSlide[] = [
  {
    mode: 'click',
    label: 'Click Mode',
    description: MODE_DESCRIPTIONS['click'] ?? '',
    // TODO: screenshot of click mode, default settings, 12 areas in
    imageSrc: '/screenshots/click-mode.png',
    imageAlt: 'Click mode gameplay showing map with highlighted areas',
  },
  {
    mode: 'name',
    label: 'Name Mode',
    description: MODE_DESCRIPTIONS['name'] ?? '',
    // TODO: screenshot of name mode, default settings, 12 areas in
    imageSrc: '/screenshots/name-mode.png',
    imageAlt: 'Name mode gameplay with text input and highlighted target area',
  },
  {
    mode: 'route',
    label: 'Route Mode',
    description: MODE_DESCRIPTIONS['route'] ?? '',
    // TODO: screenshot of route mode gameplay
    imageSrc: '/screenshots/route-mode.png',
    imageAlt: 'Route mode gameplay navigating between junctions',
  },
]

export const GameModeCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const slide = SLIDES[activeIndex]
  const dispatch = useDispatch()
  const gameSettings = useSelector(
    (state: RootState) => state.mapmemo.gameSettings,
  )

  if (!slide) {
    return null
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className={s_container}>
      <div className={s_slide_wrapper}>
        <button
          type='button'
          onClick={handlePrev}
          aria-label='Previous game mode'
          className={s_arrow_button}
        >
          &lsaquo;
        </button>
        <Link
          to='/game'
          onClick={() =>
            dispatch(
              mapmemoActions.setGameSettings({
                ...gameSettings,
                mode: slide.mode,
              }),
            )
          }
          className={s_slide_link}
        >
          <img
            src={slide.imageSrc}
            alt={slide.imageAlt}
            className={s_image}
          />
          <div className={s_slide_footer}>
            <div className={s_slide_label}>{slide.label}</div>
            <div className={s_slide_description}>{slide.description}</div>
          </div>
        </Link>
        <button
          type='button'
          onClick={handleNext}
          aria-label='Next game mode'
          className={s_arrow_button}
        >
          &rsaquo;
        </button>
      </div>
      <div className={s_dots}>
        {SLIDES.map((s, i) => (
          <button
            key={s.mode}
            type='button'
            onClick={() => setActiveIndex(i)}
            aria-label={`Go to ${s.label}`}
            className={sf_dot(i === activeIndex)}
          />
        ))}
      </div>
    </div>
  )
}

const s_container = 'flex flex-col items-center gap-3'
const s_slide_wrapper = 'flex items-center gap-2'
const s_arrow_button =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 text-lg text-slate-500 transition hover:border-slate-400 hover:text-slate-900'
const s_slide_link =
  'block overflow-hidden rounded-xl border border-slate-200 shadow-sm transition hover:shadow-md'
const s_image = 'h-48 w-80 object-cover sm:h-56 sm:w-96'
const s_slide_footer = 'bg-slate-50 px-4 py-2 text-center'
const s_slide_label = 'text-sm font-semibold text-slate-700'
const s_slide_description = 'mt-0.5 text-xs text-slate-500'
const s_dots = 'flex gap-2'
const sf_dot = (isActive: boolean) =>
  `h-2 w-2 rounded-full transition ${
    isActive ? 'bg-purple-600' : 'bg-slate-300 hover:bg-slate-400'
  }`
