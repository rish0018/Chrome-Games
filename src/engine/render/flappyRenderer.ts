import type { Sky } from '../../art/atmosphere'
import { drawSprite, drawSpriteScaled } from '../../art/sprite'
import {
  PIPE_CAP_HEIGHT,
  PIPE_CAP_WIDTH,
  PIPE_WIDTH,
  flappyDown,
  flappyMid,
  flappyUp,
  pipeCap,
  pipeRow,
} from '../../art/sprites/flappy'
import {
  FLAPPY_GROUND_HEIGHT,
  cloudBig,
  cloudSmall,
  groundFlappy,
  hillsNear,
  skyline,
} from '../../art/sprites/scenery'
import { FLAPPY } from '../constants'
import type { FlappyState, Phase } from '../types'
import { ART_H, ART_W, drawCelestials, drawNightTint, drawSkyBands, drawTiled } from './sky'

const GROUND_Y = ART_H - FLAPPY_GROUND_HEIGHT
const GAP = FLAPPY.pipeGap / 2

function drawPipePair(ctx: CanvasRenderingContext2D, x: number, gapTop: number): void {
  const capX = x - (PIPE_CAP_WIDTH - PIPE_WIDTH) / 2
  // upper pipe: body from the top of the screen, cap facing the gap
  drawSpriteScaled(ctx, pipeRow, x, 0, PIPE_WIDTH, gapTop - PIPE_CAP_HEIGHT)
  drawSprite(ctx, pipeCap, capX, gapTop - PIPE_CAP_HEIGHT)
  // lower pipe
  const bottomY = gapTop + GAP
  drawSprite(ctx, pipeCap, capX, bottomY)
  drawSpriteScaled(ctx, pipeRow, x, bottomY + PIPE_CAP_HEIGHT, PIPE_WIDTH, GROUND_Y - bottomY - PIPE_CAP_HEIGHT + 4)
}

function birdSprite(s: FlappyState, phase: Phase) {
  if (phase === 'over' || !s.started) return flappyMid
  if (s.vy < -2) return flappyUp
  if (s.vy > 2) return flappyDown
  return flappyMid
}

export function renderFlappy(
  ctx: CanvasRenderingContext2D,
  s: FlappyState,
  sky: Sky,
  now: number,
  phase: Phase,
): void {
  drawSkyBands(ctx, sky, GROUND_Y)

  const span = ART_W + 80
  for (let i = 0; i < 4; i++) {
    const x = ((((i * 130 - s.distance * (0.04 + i * 0.015)) % span) + span) % span) - 40
    drawSprite(ctx, i % 2 === 0 ? cloudBig : cloudSmall, x, 18 + i * 22)
  }

  drawTiled(skyline, (x) => drawSprite(ctx, skyline, x, GROUND_Y - skyline.height + 6), s.distance * 0.06)
  drawTiled(hillsNear, (x) => drawSprite(ctx, hillsNear, x, GROUND_Y - hillsNear.height + 3), s.distance * 0.14)
  drawNightTint(ctx, sky, 0, GROUND_Y)
  drawCelestials(ctx, sky, now, GROUND_Y)

  for (const pipe of s.pipes) drawPipePair(ctx, Math.round(pipe.x / 2), Math.round(pipe.gapTop / 2))

  drawTiled(groundFlappy, (x) => drawSprite(ctx, groundFlappy, x, GROUND_Y), s.distance / 2)
  drawNightTint(ctx, sky, GROUND_Y, ART_H - GROUND_Y)

  const bob = s.started || phase === 'over' ? 0 : Math.round(Math.sin(now / 220) * 2)
  drawSprite(ctx, birdSprite(s, phase), FLAPPY.birdX / 2, s.y / 2 + bob)
}
