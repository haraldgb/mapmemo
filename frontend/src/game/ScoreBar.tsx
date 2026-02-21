type ScoreBarProps = {
  correctCount: number
  incorrectCount: number
  totalCount: number
}

const getBorderColor = (
  correctCount: number,
  incorrectCount: number,
): string => {
  if (correctCount + incorrectCount === 0) {
    return 'rgb(148,163,184)' // slate-400
  }

  const ratio = correctCount / (correctCount + incorrectCount)

  // green (0,200,0) → yellow (220,200,0) → red (220,50,0)
  let r: number, g: number, b: number
  if (ratio > 0.5) {
    const t = (ratio - 0.5) * 2 // 0..1 from yellow to green
    r = Math.round(220 + (0 - 220) * t)
    g = 200
    b = 0
  } else {
    const t = ratio * 2 // 0..1 from red to yellow
    r = 220
    g = Math.round(50 + (200 - 50) * t)
    b = 0
  }

  return `rgb(${r},${g},${b})`
}

export const ScoreBar = ({
  correctCount,
  incorrectCount,
  totalCount,
}: ScoreBarProps) => {
  if (totalCount === 0) {
    return null
  }

  const remaining = totalCount - correctCount - incorrectCount
  const borderColor = getBorderColor(correctCount, incorrectCount)

  return (
    <div className={s_wrapper}>
      <div
        className={s_bar}
        style={{ borderColor }}
      >
        <div className={s_segments}>
          {correctCount > 0 && (
            <div
              className={s_correct}
              style={{ flex: correctCount }}
            />
          )}
          {remaining > 0 && (
            <div
              className={s_remaining}
              style={{ flex: remaining }}
            />
          )}
          {incorrectCount > 0 && (
            <div
              className={s_incorrect}
              style={{ flex: incorrectCount }}
            />
          )}
        </div>
        <div className={s_overlay}>
          {correctCount > 0 && (
            <span
              className={s_overlay_correct}
              style={{ flex: correctCount }}
            >
              {correctCount}
            </span>
          )}
          {remaining > 0 && (
            <span
              className={s_overlay_remaining}
              style={{ flex: remaining }}
            >
              {remaining}
            </span>
          )}
          {incorrectCount > 0 && (
            <span
              className={s_overlay_incorrect}
              style={{ flex: incorrectCount }}
            >
              {incorrectCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const s_wrapper = 'flex items-center md:justify-end'
const s_bar =
  'relative h-7 w-full max-w-64 overflow-hidden rounded-md border-3 md:ml-auto'
const s_segments = 'flex h-full gap-px bg-white p-px'
const s_correct = 'rounded-[2px] bg-emerald-500'
const s_remaining = 'rounded-[2px] bg-slate-300'
const s_incorrect = 'rounded-[2px] bg-red-500'
const s_overlay =
  'pointer-events-none absolute inset-0 flex items-center px-2 text-[10px] font-semibold leading-none'
const s_overlay_correct = 'text-center text-emerald-800'
const s_overlay_remaining = 'text-center text-slate-500'
const s_overlay_incorrect = 'text-center text-red-800'
