type ChevronIconProps = {
  className?: string
}

export const ChevronIcon = ({ className }: ChevronIconProps) => {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      fill='none'
      stroke='currentColor'
      strokeWidth='2.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      <polyline points='6 9 12 15 18 9' />
    </svg>
  )
}
