import { describe, expect, it } from 'vitest'
import { parseSprite } from './sprite'

const colors = { a: '#112233', b: '#445566' }

describe('parseSprite', () => {
  it('resolves characters to colours and treats . as transparent', () => {
    const s = parseSprite('t', ['a.', '.b'], colors)
    expect(s.width).toBe(2)
    expect(s.height).toBe(2)
    expect(s.pixels).toEqual(['#112233', null, null, '#445566'])
  })

  it('rejects ragged rows', () => {
    expect(() => parseSprite('t', ['aa', 'a'], colors)).toThrow(/row 1/)
  })

  it('rejects unknown characters', () => {
    expect(() => parseSprite('t', ['az'], colors)).toThrow(/unknown character "z"/)
  })

  it('rejects empty sprites', () => {
    expect(() => parseSprite('t', [], colors)).toThrow(/no rows/)
    expect(() => parseSprite('t', [''], colors)).toThrow(/empty/)
  })
})
