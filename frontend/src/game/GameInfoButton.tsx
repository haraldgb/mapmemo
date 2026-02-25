import { useState } from 'react'
import { createPortal } from 'react-dom'
import { InfoIcon } from '../components/icons/InfoIcon'

export const GameInfoButton = () => {
  const [isOpen, setIsOpen] = useState(false)

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        type='button'
        className={s_info_button}
        onClick={() => setIsOpen(!isOpen)}
        aria-label='Game info'
      >
        <InfoIcon className={s_info_icon} />
      </button>
      {isOpen &&
        createPortal(
          <div
            className={s_overlay}
            onMouseDown={handleBackdropClick}
          >
            <div className={s_panel}>
              <div className={s_title}>About MapMemo</div>
              <p className={s_paragraph}>
                MapMemo is a geography memorization game where you learn city
                neighborhoods and road layouts by clicking on a map.
              </p>
              <div className={s_subtitle}>Data sources</div>
              <ul className={s_list}>
                <li>
                  <span className={s_source}>Google Maps</span> — base map
                  tiles and rendering
                </li>
                <li>
                  <span className={s_source}>OpenStreetMap</span> — road
                  network data for route calculations
                </li>
                <li>
                  <span className={s_source}>Oslo Kommune GeoJSON</span> — area
                  and neighborhood boundaries
                </li>
              </ul>
              <div className={s_divider} />
              <p className={s_paragraph}>
                Notice something wrong?{' '}
                <a
                  href='https://github.com/haraldgb/mapmemo/issues/new'
                  target='_blank'
                  rel='noopener noreferrer'
                  className={s_link}
                >
                  Report an issue
                </a>
              </p>
              <div className={s_actions}>
                <button
                  type='button'
                  onClick={() => setIsOpen(false)}
                  className={s_close_button}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

const s_info_button =
  'inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800'
const s_info_icon = 'h-5 w-5'
const s_overlay =
  'pointer-events-auto fixed inset-0 z-20 flex items-center justify-center'
const s_panel =
  'w-[343px] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg'
const s_title = 'text-sm font-semibold text-slate-900'
const s_subtitle = 'mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500'
const s_paragraph = 'mt-2 text-sm leading-relaxed text-slate-600'
const s_list = 'mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600'
const s_source = 'font-semibold text-slate-700'
const s_divider = 'my-3 border-t border-slate-100'
const s_link =
  'font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-700'
const s_actions = 'mt-4 flex justify-end'
const s_close_button =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50'
