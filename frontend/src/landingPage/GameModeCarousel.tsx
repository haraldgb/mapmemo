import { useState, useRef } from 'react'
import type { TouchEventHandler } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import type { RootState } from '../store'
import { mapmemoActions } from '../duck/reducer'
import { MODE_DESCRIPTIONS } from '../game/consts'
import type { GameMode } from '../game/settings/settingsTypes'

type GameModeSlide = {
  mode: GameMode
  label: string
  shortLabel: string
  description: string
  // Landscape screenshot for sm+ (640px+)
  imageSrc: string
  // Portrait screenshot for narrow mobile (320–639px)
  imageSrcPortrait: string
  imageAlt: string
  placeholderGradient: string
  placeholderIcon: string
}

const SLIDES: GameModeSlide[] = [
  {
    mode: 'route',
    label: 'Route Mode',
    shortLabel: 'Route',
    description: MODE_DESCRIPTIONS['route'] ?? '',
    imageSrc: '/screenshots/route-mode.png',
    imageSrcPortrait: '/screenshots/route-mode-portrait.png',
    imageAlt: 'Route mode gameplay navigating between junctions',
    placeholderGradient:
      'radial-gradient(ellipse at 50% 0%, rgba(5,150,105,0.12) 0%, transparent 65%)',
    placeholderIcon: '⇢',
  },
  {
    mode: 'click',
    label: 'Click Mode',
    shortLabel: 'Click',
    description: MODE_DESCRIPTIONS['click'] ?? '',
    imageSrc: '/screenshots/click-mode.png',
    imageSrcPortrait: '/screenshots/click-mode-portrait.png',
    imageAlt: 'Click mode gameplay showing map with highlighted areas',
    placeholderGradient:
      'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 65%)',
    placeholderIcon: '◎',
  },
  {
    mode: 'name',
    label: 'Name Mode',
    shortLabel: 'Name',
    description: MODE_DESCRIPTIONS['name'] ?? '',
    imageSrc: '/screenshots/name-mode.png',
    imageSrcPortrait: '/screenshots/name-mode-portrait.png',
    imageAlt: 'Name mode gameplay with text input and highlighted target area',
    placeholderGradient:
      'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 65%)',
    placeholderIcon: 'Aa',
  },
]

export const GameModeCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [imgErrors, setImgErrors] = useState<
    Partial<Record<GameMode, boolean>>
  >({})
  // Preserved across renders without triggering re-renders — ref is appropriate here
  const touchStartX = useRef<number>(0)
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

  const handleImgError = () => {
    setImgErrors((prev) => ({ ...prev, [slide.mode]: true }))
  }

  const handlePlayMode = () => {
    dispatch(
      mapmemoActions.setGameSettings({ ...gameSettings, mode: slide.mode }),
    )
  }

  const showPlaceholder = imgErrors[slide.mode] ?? false

  const handleTouchStart: TouchEventHandler = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0
  }

  const handleTouchEnd: TouchEventHandler = (e) => {
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    if (delta > 50) {
      handlePrev()
    } else if (delta < -50) {
      handleNext()
    }
  }

  return (
    <div className={s_container}>
      {/* Mode tab selector */}
      <div
        className={s_tabs}
        role='tablist'
        aria-label='Game modes'
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.mode}
            type='button'
            role='tab'
            aria-selected={i === activeIndex}
            onClick={() => setActiveIndex(i)}
            className={sf_tab(i === activeIndex)}
          >
            {s.shortLabel}
          </button>
        ))}
      </div>

      {/* Slide — key forces re-mount so CSS animation re-triggers on change */}
      <div
        className={s_slide}
        key={activeIndex}
      >
        {/* Image / placeholder */}
        <div
          className={s_image_area}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {showPlaceholder ? (
            <div
              className={s_placeholder_bg}
              style={{ background: slide.placeholderGradient }}
            >
              <div className={s_placeholder_content}>
                <span className={s_placeholder_icon}>
                  {slide.placeholderIcon}
                </span>
                <span className={s_placeholder_label}>{slide.label}</span>
                <span className={s_placeholder_hint}>
                  Screenshot coming soon
                </span>
              </div>
            </div>
          ) : (
            <picture>
              {/* Portrait crop for narrow mobile (< 640px) */}
              <source
                media='(max-width: 639px)'
                srcSet={slide.imageSrcPortrait}
              />
              {/* Landscape for sm+ */}
              <img
                src={slide.imageSrc}
                alt={slide.imageAlt}
                className={s_image}
                onError={handleImgError}
              />
            </picture>
          )}

          {/* Overlaid prev/next arrows */}
          <button
            type='button'
            onClick={handlePrev}
            aria-label='Previous game mode'
            className={sf_arrow_btn('left')}
          >
            ‹
          </button>
          <button
            type='button'
            onClick={handleNext}
            aria-label='Next game mode'
            className={sf_arrow_btn('right')}
          >
            ›
          </button>
        </div>

        {/* Footer: description + play CTA */}
        <div className={s_footer}>
          <p className={s_description}>{slide.description}</p>
          <Link
            to='/game'
            onClick={handlePlayMode}
            className={s_play_link}
          >
            Play <span aria-hidden='true'>→</span>
          </Link>
        </div>
      </div>

      {/* Dot indicators */}
      <div
        className={s_dots}
        aria-hidden='true'
      >
        {SLIDES.map((s, i) => (
          <button
            key={s.mode}
            type='button'
            onClick={() => setActiveIndex(i)}
            className={sf_dot(i === activeIndex)}
          />
        ))}
      </div>
    </div>
  )
}

const s_container = 'flex flex-col gap-3'

const s_tabs = 'flex gap-1 rounded-xl bg-slate-100 p-1'

const sf_tab = (isActive: boolean) =>
  `flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
    isActive
      ? 'bg-purple-700 text-white shadow-sm'
      : 'text-slate-500 hover:text-slate-700'
  }`

const s_slide =
  'overflow-hidden rounded-xl border border-slate-200 animate-slide-in'

const s_image_area =
  'group relative aspect-[3/4] w-full overflow-hidden bg-slate-100 sm:aspect-video'

const s_placeholder_bg =
  'flex h-full w-full items-center justify-center bg-slate-50'

const s_placeholder_content = 'flex flex-col items-center gap-2 text-center'

const s_placeholder_icon = 'text-6xl text-slate-300'

const s_placeholder_label = 'text-sm font-semibold text-slate-400'

const s_placeholder_hint = 'text-xs text-slate-300'

const s_image = 'h-full w-full object-cover'

const sf_arrow_btn = (side: 'left' | 'right') =>
  `absolute ${side === 'left' ? 'left-3' : 'right-3'} top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-2xl font-light text-slate-600 shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-slate-900 sm:flex sm:opacity-0 sm:group-hover:opacity-100`

const s_footer =
  'flex items-center justify-between gap-4 border-t border-slate-100 bg-slate-50 px-5 py-4'

const s_description = 'min-w-0 flex-1 text-sm leading-relaxed text-slate-500'

const s_play_link =
  'shrink-0 rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-purple-200 transition hover:bg-purple-600 active:scale-95'

const s_dots = 'flex justify-center gap-2 pt-1'

const sf_dot = (isActive: boolean) =>
  `h-1.5 transition-all duration-300 rounded-full ${
    isActive ? 'w-5 bg-purple-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
  }`
