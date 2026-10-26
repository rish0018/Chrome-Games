import { useCallback, useState } from 'react'
import type { GameMode } from '../engine/types'
import { readJson, writeJson } from '../lib/storage'

export type HighScores = Record<GameMode, number>

const KEY = 'gestureplay.scores.v1'
const EMPTY: HighScores = { journey: 0, dino: 0, flappy: 0 }

function isScores(value: unknown): value is HighScores {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (['journey', 'dino', 'flappy'] as const).every((k) => typeof v[k] === 'number' && Number.isFinite(v[k]))
}

export function useHighScores(): [HighScores, (mode: GameMode, score: number) => boolean] {
  const [scores, setScores] = useState<HighScores>(() => readJson(KEY, isScores) ?? EMPTY)

  /** Records a score; returns true when it beats the stored best for that mode. */
  const submit = useCallback(
    (mode: GameMode, score: number): boolean => {
      if (score <= scores[mode]) return false
      const next = { ...scores, [mode]: score }
      setScores(next)
      writeJson(KEY, next)
      return true
    },
    [scores],
  )

  return [scores, submit]
}
