import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THRESHOLDS,
  GestureSmoother,
  classifyGesture,
  fingerRatios,
  type Landmark,
} from './gesture'
import { averageRatios, computeThresholds } from './calibration'

type Extended = { index?: boolean; middle?: boolean; ring?: boolean; pinky?: boolean }

const FINGER_BASE = { index: 5, middle: 9, ring: 13, pinky: 17 } as const
const FINGER_ANGLE = { index: -0.3, middle: -0.1, ring: 0.1, pinky: 0.3 } as const

/** Builds a synthetic 21-point hand; fingers point "up" (negative y) and the whole hand can be rotated. */
function makeHand(extended: Extended, rotation = 0, curledRatio = 0.9, extendedRatio = 2.1): Landmark[] {
  const wrist = { x: 0.5, y: 0.8 }
  const points: Landmark[] = Array.from({ length: 21 }, () => ({ ...wrist }))
  const rotate = (dx: number, dy: number): Landmark => ({
    x: wrist.x + dx * Math.cos(rotation) - dy * Math.sin(rotation),
    y: wrist.y + dx * Math.sin(rotation) + dy * Math.cos(rotation),
  })
  for (const finger of Object.keys(FINGER_BASE) as (keyof typeof FINGER_BASE)[]) {
    const angle = FINGER_ANGLE[finger]
    const dir = { x: Math.sin(angle), y: -Math.cos(angle) }
    const base = 0.2
    const reach = base * (extended[finger] ? extendedRatio : curledRatio)
    points[FINGER_BASE[finger]] = rotate(dir.x * base, dir.y * base)
    points[FINGER_BASE[finger] + 3] = rotate(dir.x * reach, dir.y * reach)
  }
  return points
}

describe('classifyGesture', () => {
  const classify = (hand: Landmark[]) => classifyGesture(hand, DEFAULT_THRESHOLDS, 1)

  it('detects index only', () => {
    expect(classify(makeHand({ index: true }))).toBe('index')
  })

  it('detects index + middle as peace', () => {
    expect(classify(makeHand({ index: true, middle: true }))).toBe('peace')
  })

  it('treats a fist and an open palm as none', () => {
    expect(classify(makeHand({}))).toBe('none')
    expect(classify(makeHand({ index: true, middle: true, ring: true, pinky: true }))).toBe('none')
  })

  it('is unaffected by rotating the hand', () => {
    for (const angle of [-1.2, -0.6, 0.6, 1.4, 2.8]) {
      expect(classify(makeHand({ index: true }, angle))).toBe('index')
      expect(classify(makeHand({ index: true, middle: true }, angle))).toBe('peace')
    }
  })

  it('returns none for malformed landmark input', () => {
    expect(classify([])).toBe('none')
    expect(fingerRatios([])).toBeNull()
  })
})

describe('GestureSmoother', () => {
  it('ignores a single noisy frame and follows a sustained change', () => {
    const smoother = new GestureSmoother(5)
    for (let i = 0; i < 5; i++) smoother.push('index')
    expect(smoother.push('none')).toBe('index')
    smoother.push('peace')
    smoother.push('peace')
    expect(smoother.push('peace')).toBe('peace')
  })
})

describe('GestureSmoother default window', () => {
  it('commits a new gesture after two matching frames', () => {
    const smoother = new GestureSmoother()
    smoother.push('none')
    smoother.push('none')
    expect(smoother.push('index')).toBe('none')
    expect(smoother.push('index')).toBe('index')
  })
})

describe('calibration', () => {
  const ratios = (extended: Extended, curled: number, ext: number) => {
    const r = fingerRatios(makeHand(extended, 0, curled, ext), 1)
    if (!r) throw new Error('bad synthetic hand')
    return r
  }

  it('derives per-user thresholds from three poses', () => {
    const poses = {
      fist: ratios({}, 1.1, 1.9),
      index: ratios({ index: true }, 1.1, 1.9),
      peace: ratios({ index: true, middle: true }, 1.1, 1.9),
    }
    const t = computeThresholds(poses)
    expect(t).not.toBeNull()
    expect(t!.index).toBeGreaterThan(1.1)
    expect(t!.index).toBeLessThan(1.9)
    expect(classifyGesture(makeHand({ index: true }, 0, 1.1, 1.9), t!, 1)).toBe('index')
  })

  it('rejects poses that look identical', () => {
    const flat = ratios({}, 1.1, 1.1)
    expect(computeThresholds({ fist: flat, index: flat, peace: flat })).toBeNull()
  })

  it('averages samples and rejects an empty set', () => {
    expect(averageRatios([])).toBeNull()
    const a = ratios({}, 1, 2)
    expect(averageRatios([a, a])).toEqual(a)
  })
})
