import { useEffect, useRef, useState } from 'react'

/**
 * Measures the available width and snaps it down to a multiple of `unit`, so a pixel-art canvas
 * scales by a whole number. Below one unit the full width is used (a fractional scale).
 */
export function useSnappedWidth(unit: number): { ref: React.RefObject<HTMLDivElement | null>; width: number | undefined } {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const available = Math.floor(el.clientWidth)
      setWidth(available >= unit ? Math.floor(available / unit) * unit : available)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [unit])

  return { ref, width }
}
