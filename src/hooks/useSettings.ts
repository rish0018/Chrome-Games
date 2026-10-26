import { useCallback, useState } from 'react'
import { readJson, writeJson } from '../lib/storage'

export type ControlMode = 'gesture' | 'manual'

export interface Settings {
  controlMode: ControlMode
}

const KEY = 'gestureplay.settings.v1'
const DEFAULTS: Settings = { controlMode: 'gesture' }

function isSettings(value: unknown): value is Settings {
  if (typeof value !== 'object' || value === null) return false
  const mode = (value as Record<string, unknown>).controlMode
  return mode === 'gesture' || mode === 'manual'
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, setSettings] = useState<Settings>(() => readJson(KEY, isSettings) ?? DEFAULTS)

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      writeJson(KEY, next)
      return next
    })
  }, [])

  return [settings, update]
}
