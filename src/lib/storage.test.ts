import { describe, expect, it } from 'vitest'
import { readJson, removeKey, writeJson } from './storage'

const isNumberBox = (v: unknown): v is { n: number } =>
  typeof v === 'object' && v !== null && typeof (v as { n: unknown }).n === 'number'

describe('storage (no localStorage available)', () => {
  it('round-trips through the in-memory fallback', () => {
    writeJson('k', { n: 3 })
    expect(readJson('k', isNumberBox)).toEqual({ n: 3 })
  })

  it('returns null for missing or invalid values', () => {
    expect(readJson('missing', isNumberBox)).toBeNull()
    writeJson('bad', { n: 'x' })
    expect(readJson('bad', isNumberBox)).toBeNull()
  })

  it('removes keys', () => {
    writeJson('gone', { n: 1 })
    removeKey('gone')
    expect(readJson('gone', isNumberBox)).toBeNull()
  })
})
