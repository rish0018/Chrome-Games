export type Gesture = 'index' | 'peace' | 'none'

export interface Landmark {
  x: number
  y: number
  z?: number
}

export interface FingerRatios {
  index: number
  middle: number
  ring: number
  pinky: number
}

export type Thresholds = FingerRatios

/** A finger counts as extended when tip-to-wrist is this many times longer than knuckle-to-wrist. */
export const DEFAULT_THRESHOLDS: Thresholds = { index: 1.5, middle: 1.5, ring: 1.5, pinky: 1.5 }

const WRIST = 0
const FINGERS = {
  index: { mcp: 5, tip: 8 },
  middle: { mcp: 9, tip: 12 },
  ring: { mcp: 13, tip: 16 },
  pinky: { mcp: 17, tip: 20 },
} as const

const DEFAULT_ASPECT = 4 / 3

function distance(a: Landmark, b: Landmark, aspect: number): number {
  return Math.hypot((a.x - b.x) * aspect, a.y - b.y)
}

/** Rotation-invariant: compares distances from the wrist, so tilting the hand doesn't change the result. */
export function fingerRatios(landmarks: readonly Landmark[], aspect = DEFAULT_ASPECT): FingerRatios | null {
  if (landmarks.length < 21) return null
  const wrist = landmarks[WRIST]
  const ratio = (finger: keyof typeof FINGERS): number => {
    const { mcp, tip } = FINGERS[finger]
    const base = distance(landmarks[mcp], wrist, aspect)
    return base === 0 ? 0 : distance(landmarks[tip], wrist, aspect) / base
  }
  return {
    index: ratio('index'),
    middle: ratio('middle'),
    ring: ratio('ring'),
    pinky: ratio('pinky'),
  }
}

export function classifyRatios(r: FingerRatios, t: Thresholds = DEFAULT_THRESHOLDS): Gesture {
  const index = r.index > t.index
  const middle = r.middle > t.middle
  const ring = r.ring > t.ring
  const pinky = r.pinky > t.pinky
  if (ring || pinky || !index) return 'none'
  return middle ? 'peace' : 'index'
}

export function classifyGesture(
  landmarks: readonly Landmark[],
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
  aspect = DEFAULT_ASPECT,
): Gesture {
  const ratios = fingerRatios(landmarks, aspect)
  return ratios ? classifyRatios(ratios, thresholds) : 'none'
}

/**
 * Majority vote over the last few frames so one noisy frame doesn't cause a jump or a duck.
 * The default window of 3 flips after 2 frames (~66 ms at 30 fps); a longer window adds input lag.
 */
export class GestureSmoother {
  private readonly window: Gesture[] = []
  private current: Gesture = 'none'

  constructor(private readonly size = 3) {}

  push(gesture: Gesture): Gesture {
    this.window.push(gesture)
    if (this.window.length > this.size) this.window.shift()
    const counts: Record<Gesture, number> = { index: 0, peace: 0, none: 0 }
    for (const g of this.window) counts[g]++
    let best = this.current
    for (const g of ['index', 'peace', 'none'] as const) {
      if (counts[g] > counts[best]) best = g
    }
    this.current = best
    return best
  }

  reset(): void {
    this.window.length = 0
    this.current = 'none'
  }
}
