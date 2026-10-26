import { CANVAS } from '../../art/palette'
import { DINO, FLAPPY } from '../constants'
import type { Game } from '../game'
import type { Phase, Rng, Stage } from '../types'

/** Particles live on the 400x200 art grid. */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  gravity: number
}

const FRAME_MS = 1000 / 60
const SHAKE_MS = 220

/** 4x4 Bayer matrix, 0-15. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const

/** True when the dissolve covers cell (x, y) at `level` (0 = nothing, 16 = everything). */
export function dissolveCovers(x: number, y: number, level: number): boolean {
  return BAYER[(y & 3) * 4 + (x & 3)] < level
}

/** Dissolve level for a 0-1 progress: ramps up to full cover at the midpoint, then back down. */
export function dissolveLevel(progress: number): number {
  const p = Math.min(1, Math.max(0, progress))
  return Math.round(16 * (1 - Math.abs(2 * p - 1)))
}

/** Derives visual events (landing dust, death shake and feathers) from frame-to-frame game state. */
export class Effects {
  private particles: Particle[] = []
  private shakeLeft = 0
  private prev: { phase: Phase; stage: Stage; jumping: boolean } | null = null

  constructor(
    private readonly reducedMotion = false,
    private readonly rng: Rng = Math.random,
  ) {}

  get particleCount(): number {
    return this.particles.length
  }

  observe(game: Game): void {
    const prev = this.prev
    this.prev = { phase: game.phase, stage: game.stage, jumping: game.dino.jumping }
    if (!prev) return

    if (game.phase === 'countdown' && prev.phase === 'over') {
      this.particles = []
      this.shakeLeft = 0
      return
    }
    if (game.stage !== prev.stage) this.particles = []

    if (game.stage === 'dino' && game.phase === 'playing' && prev.jumping && !game.dino.jumping) {
      this.burst(DINO.x / 2 + 12, (DINO.standY + DINO.standHeight) / 2, 7, CANVAS.dust, 1.2, 0.04)
    }

    if (game.phase === 'over' && prev.phase !== 'over') {
      if (!this.reducedMotion) this.shakeLeft = SHAKE_MS
      if (game.stage === 'flappy') {
        this.burst(
          (FLAPPY.birdX + FLAPPY.birdWidth / 2) / 2,
          (game.flappy.y + FLAPPY.birdHeight / 2) / 2,
          14,
          CANVAS.feather,
          1.8,
          0.08,
        )
      }
    }
  }

  step(dtMs: number, phase: Phase): void {
    if (phase === 'paused') return
    const frames = Math.min(dtMs, 100) / FRAME_MS
    this.shakeLeft = Math.max(0, this.shakeLeft - dtMs)
    for (const p of this.particles) {
      p.x += p.vx * frames
      p.y += p.vy * frames
      p.vy += p.gravity * frames
      p.life -= frames
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }

  /** Whole-pixel camera offset; zero when idle or when reduced motion is on. */
  shakeOffset(): { x: number; y: number } {
    if (this.shakeLeft <= 0) return { x: 0, y: 0 }
    const strength = Math.ceil((this.shakeLeft / SHAKE_MS) * 2)
    return {
      x: Math.round((this.rng() * 2 - 1) * strength),
      y: Math.round((this.rng() * 2 - 1) * strength),
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, (p.life / p.maxLife) * 1.5)
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
    }
    ctx.globalAlpha = 1
  }

  private burst(x: number, y: number, count: number, color: string, speed: number, gravity: number): void {
    for (let i = 0; i < count; i++) {
      const angle = this.rng() * Math.PI * 2
      const v = (0.4 + this.rng() * 0.6) * speed
      const life = 18 + this.rng() * 14
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 0.4,
        life,
        maxLife: life,
        color,
        size: this.rng() < 0.5 ? 1 : 2,
        gravity,
      })
    }
  }
}
