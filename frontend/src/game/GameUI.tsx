import { GameSettingsButton } from './settings/GameSettingsButton'

type IProps = {
  promptText: string
  firstTryCorrectCount: number
  lateCorrectCount: number
  scorePercent: number
  isGameActive: boolean
}

/**
 * Map/Game overlay that displays modes, game prompt and score
 */
export const GameUI = ({
  promptText,
  firstTryCorrectCount,
  lateCorrectCount,
  scorePercent,
  isGameActive,
}: IProps) => {
  return (
    <div className={s_ui_container}>
      <div className={s_mode_buttons}>
        <GameSettingsButton isGameActive={isGameActive} />
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
const s_prompt = 'text-lg font-semibold text-slate-900'
const s_score_container = 'text-sm font-medium text-slate-500 md:text-center'
