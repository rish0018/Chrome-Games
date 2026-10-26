/** Maps a single character in a sprite grid to a hex colour. `.` is always transparent. */
export type ColorMap = Record<string, string>

export interface Sprite {
  readonly name: string
  readonly width: number
  readonly height: number
  /** Row-major hex colours; null where transparent. */
  readonly pixels: readonly (string | null)[]
}

const registry: Sprite[] = []

/** Pure: validates the grid and resolves characters to colours. Throws on any malformed input. */
export function parseSprite(name: string, rows: readonly string[], colors: ColorMap): Sprite {
  if (rows.length === 0) throw new Error(`sprite "${name}" has no rows`)
  const width = rows[0].length
  if (width === 0) throw new Error(`sprite "${name}" has an empty first row`)
  const pixels: (string | null)[] = []
  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`sprite "${name}" row ${y} is ${row.length} wide, expected ${width}`)
    }
    for (let x = 0; x < width; x++) {
      const ch = row[x]
      if (ch === '.') {
        pixels.push(null)
        continue
      }
      const color = colors[ch]
      if (!color) throw new Error(`sprite "${name}" uses unknown character "${ch}" at ${x},${y}`)
      pixels.push(color)
    }
  })
  return { name, width, height: rows.length, pixels }
}

/** Parses a sprite and records it so tests can validate every sprite in the app. */
export function defineSprite(name: string, rows: readonly string[], colors: ColorMap): Sprite {
  const sprite = parseSprite(name, rows, colors)
  registry.push(sprite)
  return sprite
}

export function registeredSprites(): readonly Sprite[] {
  return registry
}

const baked = new WeakMap<Sprite, HTMLCanvasElement>()

function bake(sprite: Sprite): HTMLCanvasElement {
  let canvas = baked.get(sprite)
  if (canvas) return canvas
  canvas = document.createElement('canvas')
  canvas.width = sprite.width
  canvas.height = sprite.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(`could not create a 2d context for sprite "${sprite.name}"`)
  sprite.pixels.forEach((color, i) => {
    if (!color) return
    ctx.fillStyle = color
    ctx.fillRect(i % sprite.width, Math.floor(i / sprite.width), 1, 1)
  })
  baked.set(sprite, canvas)
  return canvas
}

export interface DrawOptions {
  flipX?: boolean
  alpha?: number
}

/** Draws a sprite at integer art-pixel coordinates, with no smoothing. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  { flipX = false, alpha = 1 }: DrawOptions = {},
): void {
  const px = Math.round(x)
  const py = Math.round(y)
  const prevAlpha = ctx.globalAlpha
  ctx.globalAlpha = prevAlpha * alpha
  if (flipX) {
    ctx.save()
    ctx.translate(px + sprite.width, py)
    ctx.scale(-1, 1)
    ctx.drawImage(bake(sprite), 0, 0)
    ctx.restore()
  } else {
    ctx.drawImage(bake(sprite), px, py)
  }
  ctx.globalAlpha = prevAlpha
}

/** Stretches a sprite to a whole-pixel box with no smoothing; a 1-row sprite repeats cleanly down a column. */
export function drawSpriteScaled(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (width <= 0 || height <= 0) return
  ctx.drawImage(bake(sprite), 0, 0, sprite.width, sprite.height, Math.round(x), Math.round(y), Math.round(width), Math.round(height))
}

/** Renders a sprite to a data URL at an integer scale, for use in <img> (icons). */
export function spriteToDataUrl(sprite: Sprite, scale = 1): string {
  const canvas = document.createElement('canvas')
  canvas.width = sprite.width * scale
  canvas.height = sprite.height * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(`could not create a 2d context for sprite "${sprite.name}"`)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(bake(sprite), 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}
