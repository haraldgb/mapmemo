type InfoIconProps = {
  className?: string
}

export const InfoIcon = ({ className }: InfoIconProps) => {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={className}
      fill='none'
    >
      <circle
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='2'
      />
      <circle
        cx='12'
        cy='8.5'
        r='1'
        fill='currentColor'
      />
      <rect
        x='11'
        y='11'
        width='2'
        height='6'
        fill='currentColor'
      />
    </svg>
  )
}
