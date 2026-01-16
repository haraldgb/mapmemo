interface IProps {
  children: React.ReactNode
}

export const MapMemoPage = (props: IProps) => {
  return (
    <section style={{ display: 'grid', gap: '12px' }}>
      <h2>MapMemo - Oslo</h2>
      {props.children}
    </section>
  )
}
