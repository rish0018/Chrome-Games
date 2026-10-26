import { SWITCH_SCORE } from '../engine/constants'
import type { GameMode, Stage } from '../engine/types'

export interface Sky {
  top: string
  bottom: string
  /** 0 (full day) to 1 (full night). Drives stars, the moon and the darkening overlay. */
  nightness: number
}

const DAY: Sky = { top: '#7fcff5', bottom: '#cdeefc', nightness: 0 }
const DUSK: Sky = { top: '#e8856a', bottom: '#ffd6a0', nightness: 0.35 }
const NIGHT: Sky = { top: '#16204a', bottom: '#3b4a85', nightness: 1 }
const DAWN: Sky = { top: '#9a86c9', bottom: '#ffc9a3', nightness: 0.3 }

/** After the switch, the Flappy world brightens from dawn to day over this many points. */
export const DAWN_POINTS = 600

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t)
  const out = (mix(ar, br) << 16) | (mix(ag, bg) << 8) | mix(ab, bb)
  return `#${out.toString(16).padStart(6, '0')}`
}

function lerpSky(a: Sky, b: Sky, t: number): Sky {
  return {
    top: lerpColor(a.top, b.top, t),
    bottom: lerpColor(a.bottom, b.bottom, t),
    nightness: a.nightness + (b.nightness - a.nightness) * t,
  }
}

const DINO_KEYFRAMES: [number, Sky][] = [
  [0, DAY],
  [0.4, DAY],
  [0.62, DUSK],
  [0.85, NIGHT],
  [1, NIGHT],
]

function dinoSky(progress: number): Sky {
  for (let i = 1; i < DINO_KEYFRAMES.length; i++) {
    const [p1, s1] = DINO_KEYFRAMES[i]
    const [p0, s0] = DINO_KEYFRAMES[i - 1]
    if (progress <= p1) return lerpSky(s0, s1, (progress - p0) / (p1 - p0))
  }
  return NIGHT
}

/**
 * Journey: the Dino stage runs day to night across 0-2000, Flappy opens at dawn and brightens.
 * Dino practice repeats that cycle every 2000 points. Flappy practice stays in daylight.
 */
export function skyFor(mode: GameMode, stage: Stage, score: number): Sky {
  if (stage === 'flappy') {
    if (mode === 'flappy') return DAY
    const t = Math.min(1, Math.max(0, (score - SWITCH_SCORE) / DAWN_POINTS))
    return lerpSky(DAWN, DAY, t)
  }
  const cycle = mode === 'journey' ? Math.min(score, SWITCH_SCORE) : score % SWITCH_SCORE
  return dinoSky(cycle / SWITCH_SCORE)
}

/** Stepped sky bands, top to bottom, for a banded pixel-art gradient. */
export function skyBands(sky: Sky, count: number): string[] {
  return Array.from({ length: count }, (_, i) => lerpColor(sky.top, sky.bottom, count === 1 ? 0 : i / (count - 1)))
}
