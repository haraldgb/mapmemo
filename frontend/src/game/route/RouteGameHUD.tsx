type Props = {
  formattedTime: string
  currentRoadName: string | null
  isLoading: boolean
  canReachDestination: boolean
  endLabel: string | null
}

export const RouteGameHUD = ({
  formattedTime,
  currentRoadName,
  isLoading,
  canReachDestination,
  endLabel,
}: Props) => {
  const prompt = isLoading
    ? 'Loading road data...'
    : canReachDestination
      ? `Click the green B marker to finish at ${endLabel ?? 'destination'}`
      : currentRoadName
        ? `On ${currentRoadName} — pick an intersection`
        : 'Select an intersection to start'

  return (
    <div className={s_container}>
      <div className={s_timer}>{formattedTime}</div>
      <div className={s_prompt}>{prompt}</div>
    </div>
  )
}

const s_container =
  'pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-col items-center gap-1 rounded-2xl bg-white/90 px-4 py-3 shadow-sm backdrop-blur-sm sm:flex-row sm:justify-between'
const s_timer = 'text-lg font-semibold tabular-nums text-slate-700'
const s_prompt = 'text-sm font-medium text-slate-600'
