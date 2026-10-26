import { readJson, writeJson } from '../lib/storage'
import { DEFAULT_THRESHOLDS, type FingerRatios, type Thresholds } from './gesture'

export const CALIBRATION_KEY = 'gestureplay.calibration.v1'
const FINGER_KEYS = ['index', 'middle', 'ring', 'pinky'] as const
const DEFAULT_EXTENDED_RATIO = 2
const MIN_THRESHOLD = 1.2
const MAX_THRESHOLD = 1.9
const MIN_SEPARATION = 0.25

export type CalibrationPose = 'fist' | 'index' | 'peace'

/** Which fingers are extended in each calibration pose. */
const POSE_EXTENDED: Record<CalibrationPose, readonly (typeof FINGER_KEYS)[number][]> = {
  fist: [],
  index: ['index'],
  peace: ['index', 'middle'],
}

export function averageRatios(samples: readonly FingerRatios[]): FingerRatios | null {
  if (samples.length === 0) return null
  const sum: FingerRatios = { index: 0, middle: 0, ring: 0, pinky: 0 }
  for (const s of samples) for (const k of FINGER_KEYS) sum[k] += s[k]
  const n = samples.length
  return { index: sum.index / n, middle: sum.middle / n, ring: sum.ring / n, pinky: sum.pinky / n }
}

function mean(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** Places each finger's threshold midway between its curled and extended readings. Returns null if the poses are too similar. */
export function computeThresholds(poses: Record<CalibrationPose, FingerRatios>): Thresholds | null {
  const result: Thresholds = { ...DEFAULT_THRESHOLDS }
  for (const finger of FINGER_KEYS) {
    const curled: number[] = []
    const extended: number[] = []
    for (const pose of Object.keys(poses) as CalibrationPose[]) {
      const bucket = POSE_EXTENDED[pose].includes(finger) ? extended : curled
      bucket.push(poses[pose][finger])
    }
    const curledMean = mean(curled)
    const extendedMean = extended.length > 0 ? mean(extended) : DEFAULT_EXTENDED_RATIO
    if (extendedMean - curledMean < MIN_SEPARATION) return null
    const mid = (curledMean + extendedMean) / 2
    result[finger] = Math.min(MAX_THRESHOLD, Math.max(MIN_THRESHOLD, mid))
  }
  return result
}

interface StoredCalibration {
  version: 1
  thresholds: Thresholds
  savedAt: number
}

function isThresholds(value: unknown): value is Thresholds {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return FINGER_KEYS.every((k) => typeof v[k] === 'number' && Number.isFinite(v[k]))
}

function isStored(value: unknown): value is StoredCalibration {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return v.version === 1 && isThresholds(v.thresholds)
}

export function loadCalibration(): Thresholds | null {
  return readJson(CALIBRATION_KEY, isStored)?.thresholds ?? null
}

export function saveCalibration(thresholds: Thresholds): void {
  const stored: StoredCalibration = { version: 1, thresholds, savedAt: Date.now() }
  writeJson(CALIBRATION_KEY, stored)
}
