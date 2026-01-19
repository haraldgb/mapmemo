interface IProps {
  children: React.ReactNode
}

export const MapMemoPage = (props: IProps) => {
  return (
    <section className='flex flex-col gap-6'>
      <div className='space-y-2'>
        <p className='text-sm font-semibold uppercase tracking-[0.25em] text-sky-600'>
          MapMemo
        </p>
        <h2 className='text-2xl font-semibold text-slate-900'>Oslo Map</h2>
        <p className='text-sm text-slate-600'>
          Toggle polygons and markers to explore districts before starting the
          game.
        </p>
      </div>
      {props.children}
    </section>
  )
}
