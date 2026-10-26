import { skyFor } from '../../art/atmosphere'
import { UI } from '../../art/palette'
import type { Game } from '../game'
import type { Stage } from '../types'
import { renderDino } from './dinoRenderer'
import { Effects, dissolveCovers, dissolveLevel } from './effects'
import { renderFlappy } from './flappyRenderer'
import { ART_H, ART_W } from './sky'

const DISSOLVE_CELL = 4

/** Sizes the canvas to the 400x200 art grid and turns smoothing off so every art pixel stays crisp. */
export function prepareCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  if (canvas.width !== ART_W) canvas.width = ART_W
  if (canvas.height !== ART_H) canvas.height = ART_H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.imageSmoothingEnabled = false
  return ctx
}

export class SceneRenderer {
  private readonly effects: Effects

  constructor(private readonly reducedMotion = false) {
    this.effects = new Effects(reducedMotion)
  }

  render(ctx: CanvasRenderingContext2D, game: Game, now: number, dtMs: number): void {
    this.effects.observe(game)
    this.effects.step(dtMs, game.phase)

    // Past the midpoint of the transition, show the Flappy world so the swap happens under the dissolve.
    const inTransition = game.phase === 'transition'
    const stage: Stage = inTransition && game.transitionProgress >= 0.5 ? 'flappy' : game.stage
    const sky = skyFor(game.mode, stage, stage === game.stage ? game.score : Math.max(game.score, 2000))

    ctx.save()
    const shake = this.effects.shakeOffset()
    ctx.translate(shake.x, shake.y)
    if (stage === 'dino') renderDino(ctx, game.dino, sky, now, game.phase)
    else renderFlappy(ctx, game.flappy, sky, now, game.phase)
    this.effects.draw(ctx)
    ctx.restore()

    if (inTransition) this.drawDissolve(ctx, game.transitionProgress)
  }

  private drawDissolve(ctx: CanvasRenderingContext2D, progress: number): void {
    const level = dissolveLevel(progress)
    if (level === 0) return
    ctx.fillStyle = UI['lcd-dark']
    if (this.reducedMotion) {
      ctx.globalAlpha = level / 16
      ctx.fillRect(0, 0, ART_W, ART_H)
      ctx.globalAlpha = 1
      return
    }
    for (let cy = 0; cy < ART_H / DISSOLVE_CELL; cy++) {
      for (let cx = 0; cx < ART_W / DISSOLVE_CELL; cx++) {
        if (dissolveCovers(cx, cy, level)) ctx.fillRect(cx * DISSOLVE_CELL, cy * DISSOLVE_CELL, DISSOLVE_CELL, DISSOLVE_CELL)
      }
    }
  }
}
