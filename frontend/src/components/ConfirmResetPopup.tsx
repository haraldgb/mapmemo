type Props = {
  onConfirm: (confirm: boolean) => void
  resetObjectLabel: string
}

export const ConfirmResetPopup = ({ onConfirm, resetObjectLabel }: Props) => {
  return (
    <div className={s_relative_wrapper}>
      <div
        className={s_container}
        role='dialog'
        aria-modal='true'
      >
        <div className={s_title}>Start new game?</div>
        <div className={s_body}>
          This will reset {resetObjectLabel}. Do you want to continue?
        </div>
        <div className={s_actions}>
          <button
            type='button'
            onClick={() => onConfirm(false)}
            className={s_secondary_button}
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={() => onConfirm(true)}
            className={s_danger_button}
          >
            Yes, reset
          </button>
        </div>
      </div>
    </div>
  )
}

const s_container =
  'absolute left-1/2 top-1/2 z-40 w-64 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 shadow-lg'
const s_title = 'text-xs font-semibold text-amber-900'
const s_body = 'mt-1 text-xs text-amber-900'
const s_actions = 'mt-3 flex items-center justify-end gap-2'
const s_secondary_button =
  'rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50'
const s_danger_button =
  'rounded-md bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700'
const s_relative_wrapper = 'relative mt-3 min-h-[80px]'
