export const ALLOWED_PATHS = {
  landing: '/',
  game: '/game',
} as const
type AllowedPath = (typeof ALLOWED_PATHS)[keyof typeof ALLOWED_PATHS]

const assertNever = (value: never): never => {
  throw new Error(`Unhandled path: ${value}`)
}

export const pathUsesMaps = (path: string) => {
  if (!isAllowedPath(path)) {
    return false
  }
  switch (path) {
    case ALLOWED_PATHS.landing:
      return false
    case ALLOWED_PATHS.game:
      return true
    default:
      return assertNever(path)
  }
}

const isAllowedPath = (path: string): path is AllowedPath => {
  return Object.values(ALLOWED_PATHS).includes(path as AllowedPath)
}
