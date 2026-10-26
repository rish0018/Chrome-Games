import { skyBands, type Sky } from '../../art/atmosphere'
import { CANVAS } from '../../art/palette'
import { drawSprite } from '../../art/sprite'
import { moon, starBig } from '../../art/sprites/scenery'

/** The visible canvas is a 400x200 art grid; one art pixel is 2 engine units. */
export const ART_W = 400
export const ART_H = 200

const BAND_COUNT = 8

/** Deterministic star field so stars don't jump between frames. */
const STARS: { x: number; y: number; big: boolean; phase: number }[] = (() => {
  let seed = 7
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
  return Array.from({ length: 26 }, () => ({
    x: Math.floor(next() * ART_W),
    y: Math.floor(next() * 110),
    big: next() < 0.25,
    phase: next() * 6,
  }))
})()

export function drawSkyBands(ctx: CanvasRenderingContext2D, sky: Sky, horizonY: number): void {
  const bands = skyBands(sky, BAND_COUNT)
  const bandHeight = Math.ceil(horizonY / BAND_COUNT)
  bands.forEach((color, i) => {
    ctx.fillStyle = color
    ctx.fillRect(0, i * bandHeight, ART_W, bandHeight + 1)
  })

}

/** Stars, moon and sun. Drawn after the night tint so they stay bright. */
export function drawCelestials(ctx: CanvasRenderingContext2D, sky: Sky, now: number, horizonY: number): void {
  const starAlpha = Math.max(0, (sky.nightness - 0.45) / 0.55)
  if (starAlpha > 0) {
    for (const star of STARS) {
      if (star.y > horizonY - 30) continue
      const twinkle = 0.6 + 0.4 * Math.sin(now / 500 + star.phase)
      ctx.globalAlpha = starAlpha * twinkle
      if (star.big) drawSprite(ctx, starBig, star.x, star.y)
      else {
        ctx.fillStyle = CANVAS.star
        ctx.fillRect(star.x, star.y, 1, 1)
      }
    }
    ctx.globalAlpha = 1
  }

  if (sky.nightness >= 0.5) {
    ctx.globalAlpha = Math.min(1, (sky.nightness - 0.4) * 2)
    drawSprite(ctx, moon, 284, 22)
    ctx.globalAlpha = 1
  } else {
    // sun, sinking a little as the evening approaches
    const cy = 28 + Math.round(sky.nightness * 40)
    ctx.fillStyle = '#ffe27a'
    for (let y = -7; y <= 7; y++) {
      for (let x = -7; x <= 7; x++) if (Math.hypot(x, y) <= 7.2) ctx.fillRect(290 + x, cy + y, 1, 1)
    }
    ctx.fillStyle = '#fff3b8'
    ctx.fillRect(287, cy - 4, 3, 2)
  }
}

/** Darkens the scenery (not the player) as night falls. */
export function drawNightTint(ctx: CanvasRenderingContext2D, sky: Sky, y: number, height: number): void {
  if (sky.nightness <= 0) return
  const alpha = sky.nightness * sky.nightness * 0.4
  ctx.fillStyle = `rgba(12, 18, 52, ${alpha.toFixed(3)})`
  ctx.fillRect(0, y, ART_W, height)
}

/** Draws a horizontally repeating sprite, scrolled left by `offset` art pixels. */
export function drawTiled(
  sprite: { width: number },
  draw: (x: number) => void,
  offset: number,
): void {
  const w = sprite.width
  const start = -(((Math.round(offset) % w) + w) % w)
  for (let x = start; x < ART_W; x += w) draw(x)
}
