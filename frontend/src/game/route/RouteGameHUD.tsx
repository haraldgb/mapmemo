type Props = {
  formattedTime: string
}

export const RouteGameHUD = ({ formattedTime }: Props) => {
  return (
    <div className={s_container}>
      <div className={s_timer}>{formattedTime}</div>
    </div>
  )
}

const s_container =
  'pointer-events-none absolute inset-x-4 top-4 z-10 px-4 py-3'
const s_timer = 'text-lg font-semibold tabular-nums text-slate-700'
