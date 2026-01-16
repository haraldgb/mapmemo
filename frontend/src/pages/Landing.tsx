import { Link } from 'react-router-dom'

export const Landing = () => {
  return (
    <div>
      <h1>Hello, welcome.</h1>
      <ul>
        <li>
          <Link to="/mapmemov1">/mapmemov1</Link>
        </li>
        <li>
          <Link to="/mapmemov2">/mapmemov2</Link>
        </li>
      </ul>
    </div>
  )
}
