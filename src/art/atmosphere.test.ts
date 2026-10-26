import { describe, expect, it } from 'vitest'
import { lerpColor, skyBands, skyFor } from './atmosphere'

describe('lerpColor', () => {
  it('returns the endpoints at t=0 and t=1 and blends in between', () => {
    expect(lerpColor('#000000', '#ffffff', 0)).toBe('#000000')
    expect(lerpColor('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(lerpColor('#000000', '#ffffff', 0.5)).toBe('#808080')
  })
})

describe('skyFor', () => {
  it('journey starts in daylight and ends the Dino stage at night', () => {
    expect(skyFor('journey', 'dino', 0).nightness).toBe(0)
    expect(skyFor('journey', 'dino', 1999.9).nightness).toBeGreaterThan(0.99)
  })

  it('nightness never decreases as the Dino score rises through 2000', () => {
    let last = -1
    for (let score = 0; score <= 2000; score += 25) {
      const n = skyFor('journey', 'dino', score).nightness
      expect(n).toBeGreaterThanOrEqual(last)
      last = n
    }
  })

  it('opens the Flappy stage at dawn and brightens to day', () => {
    const start = skyFor('journey', 'flappy', 2000)
    const later = skyFor('journey', 'flappy', 2700)
    expect(start.nightness).toBeGreaterThan(0.2)
    expect(later.nightness).toBe(0)
  })

  it('dino practice repeats the cycle every 2000 points', () => {
    expect(skyFor('dino', 'dino', 2000)).toEqual(skyFor('dino', 'dino', 0))
    expect(skyFor('dino', 'dino', 3000)).toEqual(skyFor('dino', 'dino', 1000))
  })

  it('flappy practice stays in daylight', () => {
    expect(skyFor('flappy', 'flappy', 0).nightness).toBe(0)
    expect(skyFor('flappy', 'flappy', 5000).nightness).toBe(0)
  })
})

describe('skyBands', () => {
  it('runs from the top colour to the bottom colour', () => {
    const bands = skyBands({ top: '#000000', bottom: '#ffffff', nightness: 0 }, 5)
    expect(bands).toHaveLength(5)
    expect(bands[0]).toBe('#000000')
    expect(bands[4]).toBe('#ffffff')
  })
})
