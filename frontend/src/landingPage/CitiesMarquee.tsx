import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { fetchCities } from '../api/cityApi'

export const CitiesMarquee = () => {
  const [cityNames, setCityNames] = useState<string[]>([])

  useEffect(function loadCities() {
    fetchCities()
      .then((list) => setCityNames(list.map((c) => c.name)))
      .catch(function ignoreCitiesError() {
        // Marquee simply won't show — not critical
      })
  }, [])

  if (cityNames.length === 0) {
    return null
  }

  // Duplicate list for seamless CSS loop (translateX(-50%) = one full pass)
  const items = [...cityNames, ...cityNames]
  // ~6s per city, min 14s so the scroll feels unhurried
  const duration = Math.max(14, cityNames.length * 6)

  return (
    <div
      className={s_strip}
      aria-hidden='true'
    >
      <div className={s_mask}>
        <div
          className={s_track}
          // SAFETY: React accepts CSS custom properties at runtime; TS types don't model them
          style={{ '--marquee-duration': `${duration}s` } as CSSProperties}
        >
          {items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className={s_item}
            >
              {name}
              <span className={s_sep}>·</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const s_strip = 'px-5 pt-5 sm:px-14 sm:pt-8'

const s_mask =
  'overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]'

const s_track = 'animate-marquee flex w-max'

const s_item =
  'flex items-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400'

const s_sep = 'mx-4 text-slate-300'
