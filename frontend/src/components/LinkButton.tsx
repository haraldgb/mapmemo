import { Link } from 'react-router-dom'

type Props = {
  to: string
  label: string
}

export const LinkButton = (props: Props) => {
  return (
    <div className='flex flex-wrap gap-3'>
      <Link
        to={props.to}
        className='rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900'
      >
        {props.label}
      </Link>
    </div>
  )
}
