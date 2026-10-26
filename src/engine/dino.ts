import { overlaps } from './collision'
import { DINO, HEIGHT, WIDTH } from './constants'
import type { DinoState, InputState, Rect, Rng } from './types'

export function createDino(): DinoState {
  return {
    y: DINO.standY,
    height: DINO.standHeight,
    vy: 0,
    jumping: false,
    ducking: false,
    obstacles: [],
    clouds: [],
    spawnTimer: 0,
    spawnInterval: DINO.firstSpawnTicks,
    distance: 0,
  }
}

export function dinoSpeed(score: number): number {
  const speed = DINO.baseSpeed + DINO.speedStep * Math.floor(score / DINO.speedEvery)
  return Math.min(DINO.maxSpeed, speed)
}

/** Collision box, inset from the drawn body so grazing the head, tail or cactus arms isn't a hit. */
export function dinoRect(s: DinoState): Rect {
  return {
    x: DINO.x + DINO.hitInsetX,
    y: s.y + DINO.hitInsetTop,
    width: DINO.width - DINO.hitInsetX * 2,
    height: s.height - DINO.hitInsetTop,
  }
}

function spawnObstacle(s: DinoState, rng: Rng): void {
  if (rng() < DINO.birdChance) {
    // Low birds force a duck (or a jump); mid-height birds punish a jump.
    const low = rng() < 0.5
    s.obstacles.push({
      x: WIDTH,
      y: low ? 282 + rng() * 10 : 230 + rng() * 15,
      width: 50,
      height: 40,
      type: 'bird',
    })
    return
  }
  const height = 50 + rng() * 40
  s.obstacles.push({
    x: WIDTH,
    y: DINO.groundY + 10 - height,
    width: 30,
    height,
    type: 'cactus',
  })
}

/** Advances the dino world one tick. Returns true when the dino hit something. */
export function stepDino(s: DinoState, input: InputState, speed: number, rng: Rng): boolean {
  if (input.up && !s.jumping && !s.ducking) {
    s.jumping = true
    s.vy = DINO.jumpVelocity
  }

  if (s.jumping) {
    s.y += s.vy
    s.vy += DINO.gravity * (input.down ? DINO.fastFallFactor : 1)
    if (s.y >= DINO.standY) {
      s.y = DINO.standY
      s.vy = 0
      s.jumping = false
    }
  }

  if (!s.jumping) {
    s.ducking = input.down
    s.height = s.ducking ? DINO.duckHeight : DINO.standHeight
    s.y = s.ducking ? DINO.duckY : DINO.standY
  } else {
    s.ducking = false
    s.height = DINO.standHeight
  }

  s.distance += speed

  s.spawnTimer++
  if (s.spawnTimer >= s.spawnInterval) {
    s.spawnTimer = 0
    s.spawnInterval = DINO.spawnMinTicks + rng() * DINO.spawnRangeTicks
    spawnObstacle(s, rng)
  }

  if (rng() < 0.012) {
    s.clouds.push({ x: WIDTH + 40, y: 30 + rng() * (HEIGHT * 0.4), size: 30 + rng() * 40 })
  }
  for (let i = s.clouds.length - 1; i >= 0; i--) {
    const cloud = s.clouds[i]
    cloud.x -= speed * 0.3
    if (cloud.x + cloud.size * 2 < 0) s.clouds.splice(i, 1)
  }

  const dino = dinoRect(s)
  let hit = false
  for (let i = s.obstacles.length - 1; i >= 0; i--) {
    const obstacle = s.obstacles[i]
    obstacle.x -= speed
    if (obstacle.x + obstacle.width < 0) {
      s.obstacles.splice(i, 1)
      continue
    }
    if (overlaps(dino, obstacle)) hit = true
  }
  return hit
}
