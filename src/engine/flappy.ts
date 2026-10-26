import { overlaps } from './collision'
import { FLAPPY, HEIGHT, WIDTH } from './constants'
import type { FlappyState, InputState, Rect, Rng } from './types'

export function createFlappy(): FlappyState {
  return {
    started: false,
    y: FLAPPY.startY,
    vy: 0,
    flapCooldown: 0,
    pipes: [],
    spawnTimer: FLAPPY.pipeIntervalTicks - FLAPPY.firstSpawnTicks,
    distance: 0,
  }
}

export function birdRect(s: FlappyState): Rect {
  return { x: FLAPPY.birdX, y: s.y, width: FLAPPY.birdWidth, height: FLAPPY.birdHeight }
}

export interface FlappyResult {
  hit: boolean
  points: number
}

/** Advances the flappy world one tick. */
export function stepFlappy(s: FlappyState, input: InputState, rng: Rng): FlappyResult {
  if (!s.started) {
    if (!input.up) return { hit: false, points: 0 }
    s.started = true
  }
  if (s.flapCooldown > 0) s.flapCooldown--
  if (input.up && s.flapCooldown === 0) {
    s.vy = FLAPPY.lift
    s.flapCooldown = FLAPPY.flapCooldownTicks
  }
  if (input.down) s.vy += FLAPPY.diveAccel

  s.vy += FLAPPY.gravity
  s.y += s.vy
  s.distance += FLAPPY.pipeSpeed

  let hit = false
  if (s.y < 0) {
    s.y = 0
    s.vy = 0
  }
  if (s.y + FLAPPY.birdHeight > HEIGHT) hit = true

  s.spawnTimer++
  if (s.spawnTimer >= FLAPPY.pipeIntervalTicks) {
    s.spawnTimer = 0
    const span = HEIGHT - FLAPPY.pipeGap - FLAPPY.gapMargin * 2
    s.pipes.push({ x: WIDTH, gapTop: FLAPPY.gapMargin + rng() * span, passed: false })
  }

  const bird = birdRect(s)
  let points = 0
  for (let i = s.pipes.length - 1; i >= 0; i--) {
    const pipe = s.pipes[i]
    pipe.x -= FLAPPY.pipeSpeed
    if (pipe.x + FLAPPY.pipeWidth < 0) {
      s.pipes.splice(i, 1)
      continue
    }
    const top: Rect = { x: pipe.x, y: 0, width: FLAPPY.pipeWidth, height: pipe.gapTop }
    const bottomY = pipe.gapTop + FLAPPY.pipeGap
    const bottom: Rect = { x: pipe.x, y: bottomY, width: FLAPPY.pipeWidth, height: HEIGHT - bottomY }
    if (overlaps(bird, top) || overlaps(bird, bottom)) hit = true
    if (!pipe.passed && pipe.x + FLAPPY.pipeWidth < bird.x) {
      pipe.passed = true
      points += FLAPPY.pairPoints
    }
  }
  return { hit, points }
}
