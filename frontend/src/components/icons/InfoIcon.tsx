type InfoIconProps = {
  className?: string
}

export const InfoIcon = ({ className }: InfoIconProps) => {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={className}
    >
      <path
        d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm1 15h-2v-6h2v6Zm0-8h-2V7h2v2Z'
        fill='currentColor'
      />
    </svg>
  )
}
