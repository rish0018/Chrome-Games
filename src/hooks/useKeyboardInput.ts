import { useCallback, useEffect, useRef } from 'react'
import type { InputState } from '../engine/types'

const UP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W'])
const DOWN_KEYS = new Set(['ArrowDown', 's', 'S'])

export interface ManualInput {
  inputRef: React.RefObject<InputState>
  press: (direction: 'up' | 'down') => void
  release: (direction: 'up' | 'down') => void
}

/** Held-key and pointer state for manual play, read each frame through `inputRef`. */
export function useKeyboardInput(enabled: boolean): ManualInput {
  const inputRef = useRef<InputState>({ up: false, down: false })

  const press = useCallback((direction: 'up' | 'down') => {
    inputRef.current[direction] = true
  }, [])
  const release = useCallback((direction: 'up' | 'down') => {
    inputRef.current[direction] = false
  }, [])

  useEffect(() => {
    const input = inputRef.current
    input.up = false
    input.down = false
    if (!enabled) return

    // Space must still activate a focused button (Retry, Resume...), so don't swallow it there.
    const onControl = (event: KeyboardEvent) =>
      event.target instanceof Element && event.target.closest('button, a, input, select, textarea') !== null

    const onKeyDown = (event: KeyboardEvent) => {
      if (UP_KEYS.has(event.key)) {
        input.up = true
        if (!onControl(event)) event.preventDefault()
      } else if (DOWN_KEYS.has(event.key)) {
        input.down = true
        if (!onControl(event)) event.preventDefault()
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (UP_KEYS.has(event.key)) input.up = false
      else if (DOWN_KEYS.has(event.key)) input.down = false
    }
    const releaseAll = () => {
      input.up = false
      input.down = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', releaseAll)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', releaseAll)
      releaseAll()
    }
  }, [enabled])

  return { inputRef, press, release }
}
