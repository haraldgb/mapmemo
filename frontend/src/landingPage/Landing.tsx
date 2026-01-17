import { Link } from 'react-router-dom'

export const Landing = () => {
  return (
    <div>
      <h1>Hello, welcome.</h1>
      <ul>
        <li>
          <Link to="/mapmemo">/mapmemo</Link>
        </li>
      </ul>
    </div>
  )
}
