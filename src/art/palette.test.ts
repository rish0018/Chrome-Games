import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { CANVAS, UI } from './palette'

describe('palette', () => {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8')

  it('mirrors every UI colour in the CSS theme', () => {
    for (const [name, hex] of Object.entries(UI)) {
      expect(css, `--color-${name}`).toContain(`--color-${name}: ${hex};`)
    }
  })

  it('uses valid hex colours everywhere', () => {
    for (const hex of [...Object.values(UI), ...Object.values(CANVAS)]) {
      expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})
