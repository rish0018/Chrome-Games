import {
  COUNTDOWN_TICKS,
  MAX_FRAME_MS,
  SWITCH_SCORE,
  TICK_MS,
  TRANSITION_TICKS,
} from './constants'
import { createDino, dinoSpeed, stepDino } from './dino'
import { createFlappy, stepFlappy } from './flappy'
import type {
  DinoState,
  FlappyState,
  GameMode,
  InputState,
  Phase,
  Rng,
  Stage,
} from './types'

export class Game {
  readonly mode: GameMode
  stage: Stage
  phase: Phase = 'countdown'
  score = 0
  best = 0
  dino: DinoState = createDino()
  flappy: FlappyState = createFlappy()
  countdownTicks = COUNTDOWN_TICKS
  transitionTicks = 0
  onPhaseChange?: (phase: Phase) => void

  private accumulator = 0
  private resumePhase: Phase = 'playing'
  private readonly rng: Rng

  constructor(mode: GameMode, rng: Rng = Math.random) {
    this.mode = mode
    this.rng = rng
    this.stage = mode === 'flappy' ? 'flappy' : 'dino'
  }

  get countdownSeconds(): number {
    return Math.ceil(this.countdownTicks / 60)
  }

  get transitionProgress(): number {
    return 1 - this.transitionTicks / TRANSITION_TICKS
  }

  restart(): void {
    this.stage = this.mode === 'flappy' ? 'flappy' : 'dino'
    this.score = 0
    this.dino = createDino()
    this.flappy = createFlappy()
    this.countdownTicks = COUNTDOWN_TICKS
    this.transitionTicks = 0
    this.accumulator = 0
    this.setPhase('countdown')
  }

  pause(): void {
    if (this.phase !== 'playing' && this.phase !== 'countdown' && this.phase !== 'transition') return
    this.resumePhase = this.phase
    this.setPhase('paused')
  }

  resume(): void {
    if (this.phase !== 'paused') return
    this.accumulator = 0
    this.setPhase(this.resumePhase)
  }

  /** Advances the simulation by `dtMs`, in fixed 60 Hz ticks. */
  update(dtMs: number, input: InputState): void {
    this.accumulator += Math.min(dtMs, MAX_FRAME_MS)
    while (this.accumulator >= TICK_MS) {
      this.accumulator -= TICK_MS
      this.tick(input)
    }
  }

  private setPhase(phase: Phase): void {
    if (this.phase === phase && phase !== 'countdown') return
    this.phase = phase
    this.onPhaseChange?.(phase)
  }

  private tick(input: InputState): void {
    switch (this.phase) {
      case 'countdown':
        this.countdownTicks--
        if (this.countdownTicks <= 0) this.setPhase('playing')
        return
      case 'transition':
        this.transitionTicks--
        if (this.transitionTicks <= 0) {
          this.stage = 'flappy'
          this.flappy = createFlappy()
          this.setPhase('playing')
        }
        return
      case 'playing':
        this.playTick(input)
        return
      default:
        return
    }
  }

  private playTick(input: InputState): void {
    let hit = false
    if (this.stage === 'dino') {
      const speed = dinoSpeed(this.score)
      hit = stepDino(this.dino, input, speed, this.rng)
      this.score += speed / 5
    } else {
      const result = stepFlappy(this.flappy, input, this.rng)
      hit = result.hit
      this.score += result.points
    }

    if (hit) {
      this.best = Math.max(this.best, Math.floor(this.score))
      this.setPhase('over')
      return
    }

    if (this.mode === 'journey' && this.stage === 'dino' && this.score >= SWITCH_SCORE) {
      this.dino.obstacles = []
      this.transitionTicks = TRANSITION_TICKS
      this.setPhase('transition')
    }
  }
}
