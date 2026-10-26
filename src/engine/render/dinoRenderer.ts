import type { Sky } from '../../art/atmosphere'
import { drawSprite, drawSpriteScaled } from '../../art/sprite'
import { pteroDown, pteroUp } from '../../art/sprites/bird'
import {
  CACTUS_WIDTH,
  cactusArmLeft,
  cactusArmRight,
  cactusBase,
  cactusCap,
  cactusRow,
} from '../../art/sprites/cactus'
import { dinoDead, dinoDuckA, dinoDuckB, dinoRunA, dinoRunB, dinoStand } from '../../art/sprites/dino'
import { GROUND_HEIGHT, cloudBig, cloudSmall, groundDino, hillsFar, hillsNear } from '../../art/sprites/scenery'
import { DINO } from '../constants'
import type { DinoState, Obstacle, Phase } from '../types'
import { ART_H, drawCelestials, drawNightTint, drawSkyBands, drawTiled } from './sky'

/** Ground surface in art pixels (the engine's ground line, halved). */
export const DINO_GROUND_Y = (DINO.groundY + 10) / 2

function drawCactus(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  const x = Math.round(o.x / 2)
  const y = Math.round(o.y / 2)
  const h = Math.round(o.height / 2)
  drawSprite(ctx, cactusCap, x, y)
  drawSpriteScaled(ctx, cactusRow, x, y + 2, CACTUS_WIDTH, h - 3)
  drawSprite(ctx, cactusBase, x, y + h - 1)
  drawSprite(ctx, cactusArmLeft, x, y + Math.floor(h * 0.3))
  drawSprite(ctx, cactusArmRight, x + 10, y + Math.floor(h * 0.5))
}

function dinoSprite(s: DinoState, phase: Phase) {
  if (phase === 'over') return dinoDead
  if (s.jumping) return dinoStand
  const stride = Math.floor(s.distance / 28) % 2 === 0
  if (s.ducking) return stride ? dinoDuckA : dinoDuckB
  if (phase !== 'playing') return dinoStand
  return stride ? dinoRunA : dinoRunB
}

export function renderDino(
  ctx: CanvasRenderingContext2D,
  s: DinoState,
  sky: Sky,
  now: number,
  phase: Phase,
): void {
  drawSkyBands(ctx, sky, DINO_GROUND_Y)

  for (const c of s.clouds) {
    const sprite = c.size > 50 ? cloudBig : cloudSmall
    drawSprite(ctx, sprite, c.x / 2, c.y / 2)
  }

  drawTiled(hillsFar, (x) => drawSprite(ctx, hillsFar, x, DINO_GROUND_Y - hillsFar.height), s.distance * 0.05)
  drawTiled(hillsNear, (x) => drawSprite(ctx, hillsNear, x, DINO_GROUND_Y - hillsNear.height + 2), s.distance * 0.12)
  drawTiled(groundDino, (x) => drawSprite(ctx, groundDino, x, DINO_GROUND_Y), s.distance / 2)
  if (DINO_GROUND_Y + GROUND_HEIGHT < ART_H) {
    ctx.fillStyle = '#8a5a2b'
    ctx.fillRect(0, DINO_GROUND_Y + GROUND_HEIGHT, 400, ART_H - DINO_GROUND_Y - GROUND_HEIGHT)
  }
  drawNightTint(ctx, sky, 0, ART_H)
  drawCelestials(ctx, sky, now, DINO_GROUND_Y)

  const wing = Math.floor(now / 140) % 2 === 0
  for (const o of s.obstacles) {
    if (o.type === 'cactus') drawCactus(ctx, o)
    else drawSprite(ctx, wing ? pteroUp : pteroDown, o.x / 2, o.y / 2)
  }

  drawSprite(ctx, dinoSprite(s, phase), DINO.x / 2, s.y / 2)
}
