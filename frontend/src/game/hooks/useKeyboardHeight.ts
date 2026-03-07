import { useEffect, useState } from 'react'

/**
 * Returns the current on-screen keyboard height in pixels.
 * Sets CSS property --keyboard-height
 * Relies on `interactive-widget=resizes-visual` in the viewport meta so that
 * the layout viewport stays stable and only `visualViewport.height` shrinks.
 * Returns 0 when the keyboard is closed or the API is unavailable.
 */
export function useKeyboardHeight(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(function trackKeyboardHeight() {
    const vv = window.visualViewport
    if (!vv) {
      return
    }

    const update = () => {
      const height = Math.max(0, window.innerHeight - vv.height)
      setKeyboardHeight(height)
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${height}px`,
      )
    }

    vv.addEventListener('resize', update)
    return () => {
      vv.removeEventListener('resize', update)
      document.documentElement.style.removeProperty('--keyboard-height')
    }
  }, [])

  return keyboardHeight
}
