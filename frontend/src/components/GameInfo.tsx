import { useState, type ReactNode } from 'react'
import { ChevronIcon } from './icons/ChevronIcon'

type Props = {
  title: string
  children: ReactNode
  onClose: () => void
}

export const GameInfo = ({ title, children, onClose }: Props) => {
  return (
    <div className={s_panel}>
      <div className={s_header}>
        <div className={s_title}>{title}</div>
      </div>
      <div className={s_content}>{children}</div>
      <div className={s_footer}>
        <div className={s_footer_divider} />
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
            onClick={onClose}
            className={s_close_button}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

type ChildProps = { children: ReactNode }

type SectionProps = {
  title: string
  children: ReactNode
  defaultOpen: boolean
}

export const GameInfoSection = ({
  title,
  children,
  defaultOpen,
}: SectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div>
      <button
        type='button'
        onClick={handleToggle}
        className={s_section_button}
      >
        <span className={s_subtitle}>{title}</span>
        <ChevronIcon className={sf_chevron(isOpen)} />
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  )
}

export const GameInfoTitle = ({ children }: ChildProps) => {
  return <div className={s_title}>{children}</div>
}

export const GameInfoSubtitle = ({ children }: ChildProps) => {
  return <div className={s_subtitle}>{children}</div>
}

export const GameInfoParagraph = ({ children }: ChildProps) => {
  return <p className={s_paragraph}>{children}</p>
}

export const GameInfoList = ({ children }: ChildProps) => {
  return <ul className={s_list}>{children}</ul>
}

export const GameInfoListItem = ({ children }: ChildProps) => {
  return <li>{children}</li>
}

export const GameInfoDivider = () => {
  return <div className={s_divider} />
}

export const Bold = ({ children }: ChildProps) => {
  return <span className={s_bold}>{children}</span>
}

export const Italic = ({ children }: ChildProps) => {
  return <span className={s_italic}>{children}</span>
}

export const Underline = ({ children }: ChildProps) => {
  return <span className={s_underline}>{children}</span>
}

const s_panel =
  'flex h-[635px] max-h-[calc(100dvh-6rem)] w-[343px] flex-col rounded-xl border border-slate-200 bg-white text-left shadow-lg'
const s_header = 'shrink-0 border-b border-slate-200 px-4 py-3 shadow-sm'
const s_content = 'flex-1 overflow-auto px-4 pt-2'
const s_footer = 'shrink-0 px-4 pb-4'
const s_title = 'text-base font-semibold text-slate-900'
const s_subtitle =
  'mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500'
const s_section_button =
  'mt-3 flex w-full items-center justify-between hover:opacity-70'
const sf_chevron = (isOpen: boolean) =>
  `h-3.5 w-3.5 text-slate-400 transition-transform duration-150${isOpen ? '' : ' -rotate-90'}`
const s_paragraph = 'mt-2 text-sm leading-relaxed text-slate-600'
const s_list = 'mt-2 space-y-1.5 text-sm leading-relaxed text-slate-600'
const s_divider = 'my-3 border-t border-slate-100'
const s_footer_divider = 'mb-3 border-t border-slate-100'
const s_link =
  'font-semibold text-purple-600 underline underline-offset-2 hover:text-purple-700'
const s_actions = 'mt-4 flex justify-end'
const s_close_button =
  'rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50'
const s_bold = 'font-semibold text-slate-700'
const s_italic = 'italic'
const s_underline = 'underline underline-offset-2'
