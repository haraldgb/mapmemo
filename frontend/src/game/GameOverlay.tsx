import { MODE_OPTIONS } from './consts'

type GameOverlayProps = {
  modeCount: number
  promptText: string
  firstTryCorrectCount: number
  lateCorrectCount: number
  scorePercent: number
  onModeChange: (value: number) => void
}

export const GameOverlay = ({
  modeCount,
  promptText,
  firstTryCorrectCount,
  lateCorrectCount,
  scorePercent,
  onModeChange,
}: GameOverlayProps) => {
  return (
    <div className='pointer-events-none absolute inset-x-4 top-4 z-10'>
      <div className='grid items-center gap-3 rounded-2xl bg-transparent px-4 py-3 text-center md:grid-cols-[1fr_auto_1fr]'>
        <div className='pointer-events-auto flex flex-wrap justify-center gap-2 pt-1'>
          {MODE_OPTIONS.map((mode) => {
            const isActive = mode.value === modeCount
            return (
              <button
                key={mode.value}
                type='button'
                onClick={() => onModeChange(mode.value)}
                className={
                  isActive
                    ? 'rounded-full border border-purple-600 bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white'
                    : 'rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-400'
                }
              >
                {mode.label}
              </button>
            )
          })}
        </div>
        <div className='text-lg font-semibold text-slate-900'>{promptText}</div>
        <div className='text-sm font-medium text-slate-500 md:text-center'>
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
    </div>
  )
}
