import { describe, expect, it } from 'vitest'
import { Game } from './game'
import { createDino, stepDino } from './dino'
import { createFlappy, stepFlappy } from './flappy'
import { COUNTDOWN_TICKS, DINO, FLAPPY, HEIGHT, TICK_MS } from './constants'
import type { InputState, Phase } from './types'

const idle: InputState = { up: false, down: false }
const never = () => 0.99

function run(game: Game, ticks: number, input: InputState = idle) {
  for (let i = 0; i < ticks; i++) game.update(TICK_MS + 0.001, input)
}

function startPlaying(game: Game) {
  run(game, COUNTDOWN_TICKS + 1)
  expect(game.phase).toBe('playing')
}

describe('dino', () => {
  it('jumps on up, lands, and ducks on down', () => {
    const s = createDino()
    stepDino(s, { up: true, down: false }, 5, never)
    expect(s.jumping).toBe(true)
    for (let i = 0; i < 80 && s.jumping; i++) stepDino(s, idle, 5, never)
    expect(s.jumping).toBe(false)
    expect(s.y).toBe(DINO.standY)
    stepDino(s, { up: false, down: true }, 5, never)
    expect(s.ducking).toBe(true)
    expect(s.height).toBe(DINO.duckHeight)
    stepDino(s, idle, 5, never)
    expect(s.height).toBe(DINO.standHeight)
  })

  it('gives at least 250 ms of jump timing leeway for the tallest cactus at start speed', () => {
    const survives = (x0: number): boolean => {
      const s = createDino()
      s.spawnTimer = -1e9
      s.obstacles.push({ x: x0, y: DINO.groundY + 10 - 90, width: 30, height: 90, type: 'cactus' })
      let hit = stepDino(s, { up: true, down: false }, DINO.baseSpeed, never)
      for (let t = 0; t < 120 && !hit; t++) hit = stepDino(s, idle, DINO.baseSpeed, never)
      return !hit
    }
    let safe = 0
    for (let x0 = 110; x0 < 700; x0++) if (survives(x0)) safe++
    const windowMs = (safe / DINO.baseSpeed) * TICK_MS
    expect(windowMs).toBeGreaterThanOrEqual(250)
  })

  it('does not throw when an obstacle leaves the screen at index 0', () => {
    const s = createDino()
    s.obstacles.push({ x: -100, y: 290, width: 30, height: 80, type: 'cactus' })
    s.obstacles.push({ x: 700, y: 290, width: 30, height: 80, type: 'cactus' })
    expect(() => stepDino(s, idle, 5, never)).not.toThrow()
    expect(s.obstacles).toHaveLength(1)
  })

  it('reports a hit when a cactus overlaps the dino', () => {
    const s = createDino()
    s.obstacles.push({ x: 60, y: 290, width: 30, height: 80, type: 'cactus' })
    expect(stepDino(s, idle, 5, never)).toBe(true)
  })

  it('low birds hit a standing dino but not a ducking one', () => {
    const bird = { x: 70, y: 285, width: 50, height: 40, type: 'bird' as const }
    const standing = createDino()
    standing.obstacles.push({ ...bird })
    expect(stepDino(standing, idle, 5, never)).toBe(true)
    const ducking = createDino()
    ducking.obstacles.push({ ...bird })
    expect(stepDino(ducking, { up: false, down: true }, 5, never)).toBe(false)
  })
})

describe('flappy', () => {
  it('hovers until the first flap, then starts falling', () => {
    const s = createFlappy()
    for (let i = 0; i < 120; i++) stepFlappy(s, idle, never)
    expect(s.started).toBe(false)
    expect(s.y).toBe(FLAPPY.startY)
    expect(s.pipes).toHaveLength(0)
    stepFlappy(s, { up: true, down: false }, never)
    expect(s.started).toBe(true)
    expect(s.vy).toBeLessThan(0)
  })

  it('scores a pipe pair exactly once', () => {
    const s = createFlappy()
    s.started = true
    s.pipes.push({ x: FLAPPY.birdX - FLAPPY.pipeWidth + 2, gapTop: 80, passed: false })
    let total = 0
    for (let i = 0; i < 5; i++) {
      s.y = 150
      s.vy = 0
      total += stepFlappy(s, idle, never).points
    }
    expect(total).toBe(FLAPPY.pairPoints)
  })

  it('dies on the floor and clamps at the ceiling', () => {
    const s = createFlappy()
    s.started = true
    s.y = HEIGHT
    expect(stepFlappy(s, idle, never).hit).toBe(true)
    const c = createFlappy()
    c.started = true
    c.y = 1
    c.vy = -20
    expect(stepFlappy(c, idle, never).hit).toBe(false)
    expect(c.y).toBe(0)
  })

  it('flap respects its cooldown', () => {
    const s = createFlappy()
    stepFlappy(s, { up: true, down: false }, never)
    const afterFirst = s.vy
    expect(afterFirst).toBeLessThan(0)
    stepFlappy(s, { up: true, down: false }, never)
    expect(s.vy).toBeGreaterThan(afterFirst)
  })
})

describe('Game', () => {
  it('counts down before playing', () => {
    const g = new Game('dino', never)
    expect(g.phase).toBe('countdown')
    expect(g.countdownSeconds).toBe(3)
    startPlaying(g)
  })

  it('fires game over once and freezes', () => {
    const g = new Game('dino', never)
    const phases: Phase[] = []
    startPlaying(g)
    g.onPhaseChange = (p) => phases.push(p)
    g.dino.obstacles.push({ x: 60, y: 290, width: 30, height: 80, type: 'cactus' })
    run(g, 5)
    expect(g.phase).toBe('over')
    const frozen = g.score
    run(g, 120)
    expect(g.score).toBe(frozen)
    expect(phases.filter((p) => p === 'over')).toHaveLength(1)
  })

  it('switches from dino to flappy exactly once at 2000 in journey mode', () => {
    const g = new Game('journey', never)
    startPlaying(g)
    g.score = 1999.9
    const phases: Phase[] = []
    g.onPhaseChange = (p) => phases.push(p)
    run(g, 3)
    expect(g.phase).toBe('transition')
    run(g, 200)
    expect(g.stage).toBe('flappy')
    expect(phases.filter((p) => p === 'transition')).toHaveLength(1)
    expect(g.score).toBeGreaterThanOrEqual(2000)
  })

  it('does not switch in dino-only mode', () => {
    const g = new Game('dino', never)
    startPlaying(g)
    g.score = 1999.9
    run(g, 5)
    expect(g.stage).toBe('dino')
    expect(g.phase).toBe('playing')
  })

  it('pauses and resumes without advancing', () => {
    const g = new Game('dino', never)
    startPlaying(g)
    g.pause()
    const s = g.score
    run(g, 60)
    expect(g.score).toBe(s)
    g.resume()
    run(g, 10)
    expect(g.score).toBeGreaterThan(s)
  })

  it('restart resets state and keeps the best score', () => {
    const g = new Game('flappy', never)
    startPlaying(g)
    g.score = 120
    g.flappy.started = true
    g.flappy.y = HEIGHT
    run(g, 2)
    expect(g.phase).toBe('over')
    g.restart()
    expect(g.phase).toBe('countdown')
    expect(g.score).toBe(0)
    expect(g.best).toBe(120)
  })
})
