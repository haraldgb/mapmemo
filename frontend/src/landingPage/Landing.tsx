import { Link } from 'react-router-dom'

export const Landing = () => {
  return (
    <div>
      <h1>Landing Page</h1>
      <ul>
        <li>
          <Link to='/mapmemo'>/mapmemo</Link>
        </li>
        <li>
          <Link to='/game?seed=8chrseed'>/game?seed={`{8chrseed}`}</Link>
        </li>
      </ul>
    </div>
  )
}
