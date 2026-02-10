export const loadFromLocalStorage = <T>(
  key: string,
  isValid: (value: unknown) => value is T,
): T | null => {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isValid(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const saveToLocalStorage = (key: string, value: unknown): void => {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}
