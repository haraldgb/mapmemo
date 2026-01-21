import { MODE_OPTIONS } from './consts'

type IProps = {
  modeCount: number
  promptText: string
  firstTryCorrectCount: number
  lateCorrectCount: number
  scorePercent: number
  onModeChange: (value: number) => void
}

/**
 * Map/Game overlay that displays modes, game prompt and score
 */
export const GameUI = ({
  modeCount,
  promptText,
  firstTryCorrectCount,
  lateCorrectCount,
  scorePercent,
  onModeChange,
}: IProps) => {
  return (
    <div className={s_ui_container}>
      <div className={s_mode_buttons}>
        {MODE_OPTIONS.map((mode) => {
          const isActive = mode.value === modeCount
          return (
            <button
              key={mode.value}
              type='button'
              onClick={() => onModeChange(mode.value)}
              className={sf_mode_button(isActive)}
            >
              {mode.label}
            </button>
          )
        })}
      </div>
      <div className={s_prompt}>{promptText}</div>
      <div className={s_score_container}>
        <span className='font-semibold text-emerald-600'>
          Riktig: {firstTryCorrectCount}
        </span>
        <span className='mx-2'>-</span>
        <span className='font-semibold text-rose-600'>
          Feil: {lateCorrectCount}
        </span>
        <span className='mx-2'>-</span>
        {scorePercent}%
      </div>
    </div>
  )
}

const s_ui_container =
  'pointer-events-none absolute inset-x-4 top-4 z-10 grid items-center gap-3 rounded-2xl bg-transparent px-4 py-3 text-center md:grid-cols-[1fr_auto_1fr]'
const s_mode_buttons =
  'pointer-events-auto flex flex-wrap justify-center gap-2 pt-1'
const sf_mode_button = (isActive: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm font-semibold ${isActive ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`
const s_prompt = 'text-lg font-semibold text-slate-900'
const s_score_container = 'text-sm font-medium text-slate-500 md:text-center'
