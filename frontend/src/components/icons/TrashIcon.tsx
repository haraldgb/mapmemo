type TrashIconProps = {
  className?: string
}

export const TrashIcon = ({ className }: TrashIconProps) => {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      <polyline points='3 6 5 6 21 6' />
      <path d='m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6' />
      <path d='M10 11v6' />
      <path d='M14 11v6' />
      <path d='M9 6V4h6v2' />
    </svg>
  )
}
