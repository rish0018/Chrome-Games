export const WIDTH = 800
export const HEIGHT = 400
export const TICK_MS = 1000 / 60
export const MAX_FRAME_MS = 100

export const COUNTDOWN_TICKS = 180
export const TRANSITION_TICKS = 100
export const SWITCH_SCORE = 2000

export const DINO = {
  x: 50,
  width: 60,
  standY: 310,
  standHeight: 60,
  duckY: 340,
  duckHeight: 30,
  jumpVelocity: -17,
  gravity: 0.8,
  fastFallFactor: 2.5,
  hitInsetX: 8,
  hitInsetTop: 6,
  baseSpeed: 5,
  speedStep: 0.5,
  speedEvery: 500,
  maxSpeed: 12,
  firstSpawnTicks: 100,
  spawnMinTicks: 70,
  spawnRangeTicks: 100,
  birdChance: 0.3,
  groundY: 360,
} as const

export const FLAPPY = {
  birdX: 150,
  birdWidth: 40,
  birdHeight: 30,
  startY: 200,
  gravity: 0.4,
  lift: -8,
  flapCooldownTicks: 10,
  diveAccel: 0.6,
  pipeSpeed: 5,
  pipeWidth: 60,
  pipeGap: 150,
  pipeIntervalTicks: 120,
  firstSpawnTicks: 60,
  gapMargin: 60,
  pairPoints: 10,
} as const
