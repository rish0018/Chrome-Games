import { describe, expect, it } from 'vitest'
import { Game } from '../game'
import { COUNTDOWN_TICKS, TICK_MS } from '../constants'
import { Effects, dissolveCovers, dissolveLevel } from './effects'

const never = () => 0.99
const idle = { up: false, down: false }

function playing(mode: 'dino' | 'flappy'): Game {
  const g = new Game(mode, never)
  for (let i = 0; i < COUNTDOWN_TICKS + 1; i++) g.update(TICK_MS + 0.001, idle)
  expect(g.phase).toBe('playing')
  return g
}

describe('Effects', () => {
  it('spawns landing dust exactly once per landing', () => {
    const g = playing('dino')
    const fx = new Effects(false, never)
    fx.observe(g)
    g.dino.jumping = true
    fx.observe(g)
    expect(fx.particleCount).toBe(0)
    g.dino.jumping = false
    fx.observe(g)
    const spawned = fx.particleCount
    expect(spawned).toBeGreaterThan(0)
    fx.observe(g)
    expect(fx.particleCount).toBe(spawned)
  })

  it('shakes on death and the shake decays to zero', () => {
    const g = playing('dino')
    const fx = new Effects(false, () => 0.9)
    fx.observe(g)
    g.phase = 'over'
    fx.observe(g)
    expect(fx.shakeOffset()).not.toEqual({ x: 0, y: 0 })
    fx.step(500, 'over')
    expect(fx.shakeOffset()).toEqual({ x: 0, y: 0 })
  })

  it('does not shake with reduced motion', () => {
    const g = playing('dino')
    const fx = new Effects(true, () => 0.9)
    fx.observe(g)
    g.phase = 'over'
    fx.observe(g)
    expect(fx.shakeOffset()).toEqual({ x: 0, y: 0 })
  })

  it('throws feathers when the flappy bird dies, and clears them on restart', () => {
    const g = playing('flappy')
    const fx = new Effects(false, never)
    fx.observe(g)
    g.phase = 'over'
    fx.observe(g)
    expect(fx.particleCount).toBeGreaterThan(0)
    g.phase = 'countdown'
    fx.observe(g)
    expect(fx.particleCount).toBe(0)
  })

  it('freezes particles while paused and expires them otherwise', () => {
    const g = playing('flappy')
    const fx = new Effects(false, never)
    fx.observe(g)
    g.phase = 'over'
    fx.observe(g)
    const count = fx.particleCount
    for (let i = 0; i < 50; i++) fx.step(100, 'paused')
    expect(fx.particleCount).toBe(count)
    for (let i = 0; i < 50; i++) fx.step(100, 'over')
    expect(fx.particleCount).toBe(0)
  })
})

describe('dissolve', () => {
  const covered = (level: number) => {
    let n = 0
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) if (dissolveCovers(x, y, level)) n++
    return n
  }

  it('covers nothing at level 0 and everything at level 16, growing steadily', () => {
    expect(covered(0)).toBe(0)
    expect(covered(16)).toBe(16)
    for (let level = 1; level <= 16; level++) expect(covered(level)).toBeGreaterThanOrEqual(covered(level - 1))
  })

  it('peaks at the midpoint of the transition and is clear at both ends', () => {
    expect(dissolveLevel(0)).toBe(0)
    expect(dissolveLevel(0.5)).toBe(16)
    expect(dissolveLevel(1)).toBe(0)
  })
})
