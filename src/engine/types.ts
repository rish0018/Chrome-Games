export type GameMode = 'journey' | 'dino' | 'flappy'
export type Stage = 'dino' | 'flappy'
export type Phase = 'countdown' | 'playing' | 'paused' | 'transition' | 'over'
export type Rng = () => number

export interface InputState {
  up: boolean
  down: boolean
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export interface Obstacle extends Rect {
  type: 'cactus' | 'bird'
}

export interface Cloud {
  x: number
  y: number
  size: number
}

export interface Pipe {
  x: number
  gapTop: number
  passed: boolean
}

export interface DinoState {
  y: number
  height: number
  vy: number
  jumping: boolean
  ducking: boolean
  obstacles: Obstacle[]
  clouds: Cloud[]
  spawnTimer: number
  spawnInterval: number
  distance: number
}

export interface FlappyState {
  /** The bird hovers, with no gravity or pipes, until the first flap. */
  started: boolean
  y: number
  vy: number
  flapCooldown: number
  pipes: Pipe[]
  spawnTimer: number
  distance: number
}
