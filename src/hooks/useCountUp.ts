import { useEffect, useRef, useState } from 'react'

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

/**
 * Anime une valeur jusqu’à `target` lorsque `active` devient true (ex. entrée viewport).
 */
export function useCountUp(target: number, active: boolean, skipAnimation: boolean) {
  const [value, setValue] = useState(() => (skipAnimation ? target : 0))
  const ranRef = useRef(false)

  useEffect(() => {
    if (skipAnimation) {
      setValue(target)
      return
    }
    ranRef.current = false
    setValue(0)
  }, [target, skipAnimation])

  useEffect(() => {
    if (skipAnimation) return
    if (!active) return
    if (ranRef.current) return
    ranRef.current = true

    const durationMs = 1450
    let start: number | null = null
    let raf = 0

    const step = (now: number) => {
      if (start === null) start = now
      const t = Math.min(1, (now - start) / durationMs)
      setValue(target * easeOutCubic(t))
      if (t < 1) raf = requestAnimationFrame(step)
      else setValue(target)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [active, target, skipAnimation])

  return value
}
