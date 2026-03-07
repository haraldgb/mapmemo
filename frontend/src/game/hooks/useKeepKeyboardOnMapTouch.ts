import { useEffect, useRef } from 'react'

/**
 * Keeps the virtual keyboard open when the user taps or drags the map.
 * Detects map touches (non-interactive targets) and refocuses the input
 * if it blurs as a result. Keyboard dismiss (back button) is unaffected
 * because it never triggers a touchstart.
 *
 * @param getInput - Returns the input element to keep focused. Called lazily.
 * @param enabled  - When false, blur events are not intercepted.
 */
export function useKeepKeyboardOnMapTouch(
  getInput: () => HTMLInputElement | null,
  enabled: boolean,
): void {
  const enabledRef = useRef(enabled)
  useEffect(
    function syncEnabledRef() {
      enabledRef.current = enabled
    },
    [enabled],
  )

  const mapTouchActiveRef = useRef(false)
  const activeTouchCountRef = useRef(0)

  useEffect(function trackMapGesture() {
    // seems quite excessive, but handles both 1- and >=2-finger touches.
    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as Element
      if (target.closest('input, button, select, textarea')) {
        return
      }
      if (
        e.touches.length === 1 &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        return
      }
      activeTouchCountRef.current = e.touches.length
      mapTouchActiveRef.current = true
    }
    const handleTouchEnd = (e: TouchEvent) => {
      activeTouchCountRef.current = e.touches.length
    }
    window.addEventListener('touchstart', handleTouchStart, {
      capture: true,
      passive: true,
    })
    window.addEventListener('touchend', handleTouchEnd, {
      capture: true,
      passive: true,
    })
    window.addEventListener('touchcancel', handleTouchEnd, {
      capture: true,
      passive: true,
    })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart, {
        capture: true,
      })
      window.removeEventListener('touchend', handleTouchEnd, { capture: true })
      window.removeEventListener('touchcancel', handleTouchEnd, {
        capture: true,
      })
    }
  }, [])

  useEffect(function refocusAfterMapTouch() {
    const input = getInput()
    if (!input) {
      return
    }
    const handleBlur = () => {
      if (!mapTouchActiveRef.current) {
        return
      }
      if (activeTouchCountRef.current === 0) {
        mapTouchActiveRef.current = false
      }
      if (!enabledRef.current) {
        return
      }
      input.focus()
    }
    input.addEventListener('blur', handleBlur)
    return () => input.removeEventListener('blur', handleBlur)
    // getInput is intentionally excluded — it's called once on mount to get the
    // stable DOM element. Re-running on every render would re-register needlessly.
  }, [])
}
