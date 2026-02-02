import { useSearchParams } from 'react-router-dom'
import { isValidSeed, randomSeed } from '../utils'

export const useSeedFromUrl = () => {
  const [urlQueryParams] = useSearchParams()
  const seedParam = urlQueryParams.get('seed') ?? ''
  return isValidSeed(seedParam) ? seedParam : randomSeed()
}
