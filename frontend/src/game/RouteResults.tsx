import { Spinner } from '../components/Spinner'
import type { RouteResultState } from './hooks/useRouteResult'

type Props = {
  resultState: RouteResultState
  formattedGameTime: string
  onPlayAgain: () => void
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins === 0) {
    return `${secs}s`
  }
  return `${mins}m ${secs}s`
}

const formatTimeDifference = (seconds: number): string => {
  if (seconds <= 0) {
    return 'Perfect route!'
  }
  return `+${formatDuration(seconds)} slower`
}

export const RouteResults = ({
  resultState,
  formattedGameTime,
  onPlayAgain,
}: Props) => {
  if (resultState.status === 'idle') {
    return null
  }

  return (
    <div className={s_overlay}>
      <div className={s_panel}>
        <h2 className={s_title}>Route Complete!</h2>

        {resultState.status === 'loading' && (
          <div className={s_loading}>
            <Spinner />
            <span className={s_loading_text}>Calculating route score...</span>
          </div>
        )}

        {resultState.status === 'error' && (
          <div className={s_error}>
            <p className={s_error_text}>{resultState.error}</p>
            <p className={s_error_sub}>Time played: {formattedGameTime}</p>
          </div>
        )}

        {resultState.status === 'success' && (
          <div className={s_stats}>
            <StatRow
              label='Your route'
              value={formatDuration(resultState.result.playerRouteTime)}
              color='text-blue-600'
            />
            <StatRow
              label='Optimal route'
              value={formatDuration(resultState.result.optimalRouteTime)}
              color='text-emerald-600'
            />
            <div className={s_divider} />
            <StatRow
              label='Difference'
              value={formatTimeDifference(resultState.result.timeDifference)}
              color={
                resultState.result.timeDifference <= 0
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }
            />
            <StatRow
              label='Time played'
              value={formattedGameTime}
              color='text-slate-600'
            />
          </div>
        )}

        <button
          type='button'
          onClick={onPlayAgain}
          className={s_play_again}
        >
          Play again
        </button>
      </div>
    </div>
  )
}

type StatRowProps = {
  label: string
  value: string
  color: string
}

const StatRow = ({ label, value, color }: StatRowProps) => {
  return (
    <div className={s_stat_row}>
      <span className={s_stat_label}>{label}</span>
      <span className={`${s_stat_value} ${color}`}>{value}</span>
    </div>
  )
}

// --- Styles ---

const s_overlay =
  'pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/30'
const s_panel = 'flex w-80 flex-col gap-4 rounded-2xl bg-white p-6 shadow-xl'
const s_title = 'text-center text-xl font-bold text-slate-800'
const s_loading = 'flex flex-col items-center gap-3 py-4'
const s_loading_text = 'text-sm text-slate-500'
const s_error = 'flex flex-col gap-1 py-2'
const s_error_text = 'text-center text-sm text-red-600'
const s_error_sub = 'text-center text-sm text-slate-500'
const s_stats = 'flex flex-col gap-2'
const s_divider = 'border-t border-slate-200'
const s_stat_row = 'flex items-center justify-between'
const s_stat_label = 'text-sm text-slate-500'
const s_stat_value = 'text-sm font-semibold'
const s_play_again =
  'mt-2 rounded-xl bg-purple-600 px-6 py-3 text-base font-bold text-white shadow-lg transition hover:bg-purple-700 hover:shadow-xl active:scale-95'
