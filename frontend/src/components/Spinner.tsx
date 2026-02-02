type SpinnerProps = {
  className?: string
}

export const Spinner = ({ className }: SpinnerProps) => {
  return <div className={className ?? s_spinner} />
}

const s_spinner =
  'h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500'
