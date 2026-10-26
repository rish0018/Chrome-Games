import { CANVAS } from '../palette'
import { compose } from '../compose'

const CLOUD = { w: CANVAS.cloud, s: CANVAS.cloudShade }

function cloud(name: string, width: number, height: number, blobs: [number, number, number, number][]) {
  return compose(name, width, height, CLOUD, (g) => {
    for (const [x, y, w, h] of blobs) g.rect(x, y, w, h, 'w')
    g.rect(2, height - 2, width - 4, 1, 's')
  })
}

export const cloudBig = cloud('cloud-big', 26, 10, [
  [4, 5, 18, 5],
  [0, 7, 26, 3],
  [8, 2, 7, 4],
  [14, 3, 6, 3],
])
export const cloudSmall = cloud('cloud-small', 16, 7, [
  [3, 3, 10, 4],
  [0, 5, 16, 2],
  [5, 1, 5, 3],
])

/** Seamless horizontal hill strip: heights come from sines whose period divides the tile width. */
export const HILL_PERIOD = 96

function hills(name: string, height: number, base: number, amp1: number, amp2: number, phase: number, fill: string) {
  return compose(name, HILL_PERIOD, height, { F: fill, T: CANVAS.white }, (g) => {
    for (let x = 0; x < HILL_PERIOD; x++) {
      const t = (x / HILL_PERIOD) * Math.PI * 2
      const h = Math.round(base + amp1 * Math.sin(t) + amp2 * Math.sin(2 * t + phase))
      const top = Math.max(0, Math.min(height - 1, height - h))
      g.rect(x, top, 1, height - top, 'F')
    }
  })
}

export const hillsFar = hills('hills-far', 34, 22, 8, 3, 0.6, CANVAS.hillFar)
export const hillsNear = hills('hills-near', 26, 14, 6, 3, 2.2, CANVAS.hillNear)

/** City skyline for Flappy: a seamless 100-pixel strip of buildings with lit windows. */
export const SKYLINE_WIDTH = 100
const BUILDINGS: [number, number, number][] = [
  [0, 12, 22],
  [12, 9, 30],
  [21, 14, 18],
  [35, 10, 34],
  [45, 13, 24],
  [58, 9, 16],
  [67, 15, 28],
  [82, 10, 20],
  [92, 8, 26],
]
export const skyline = compose(
  'skyline',
  SKYLINE_WIDTH,
  40,
  { B: CANVAS.skylineNear, R: CANVAS.skylineFar, W: CANVAS.windowLit },
  (g) => {
    for (const [x, w, h] of BUILDINGS) {
      const top = 40 - h
      g.rect(x, top, w, h, 'B')
      g.rect(x, top, w, 1, 'R')
      for (let wy = top + 3; wy < 38; wy += 4) {
        for (let wx = x + 2; wx < x + w - 1; wx += 3) {
          if ((wx * 7 + wy * 13) % 5 < 2) g.rect(wx, wy, 2, 2, 'W')
        }
      }
    }
  },
)

/** Dino ground strip: sand edge, pebbles and dirt. Seamless at 64 pixels. */
export const GROUND_TILE_WIDTH = 64
export const GROUND_HEIGHT = 15
export const groundDino = compose(
  'ground-dino',
  GROUND_TILE_WIDTH,
  GROUND_HEIGHT,
  { D: CANVAS.sandDark, S: CANVAS.sand, T: CANVAS.dirt, P: CANVAS.pebble },
  (g) => {
    g.rect(0, 0, GROUND_TILE_WIDTH, 1, 'D')
    g.rect(0, 1, GROUND_TILE_WIDTH, 8, 'S')
    g.rect(0, 9, GROUND_TILE_WIDTH, GROUND_HEIGHT - 9, 'T')
    for (const [x, y, w] of [
      [6, 3, 3],
      [20, 6, 2],
      [33, 2, 4],
      [47, 5, 2],
      [57, 7, 3],
      [12, 11, 3],
      [40, 12, 2],
    ] as const) {
      g.rect(x, y, w, 1, 'P')
    }
  },
)

/** Flappy ground: grass with diagonal stripes over dirt. Seamless at 16 pixels. */
export const FLAPPY_GROUND_WIDTH = 16
export const FLAPPY_GROUND_HEIGHT = 14
export const groundFlappy = compose(
  'ground-flappy',
  FLAPPY_GROUND_WIDTH,
  FLAPPY_GROUND_HEIGHT,
  {
    G: CANVAS.groundGrass,
    g: CANVAS.groundGrassDark,
    D: CANVAS.groundDirt,
    d: CANVAS.groundDirtDark,
    K: CANVAS.pipeOutline,
  },
  (g) => {
    g.rect(0, 0, FLAPPY_GROUND_WIDTH, 1, 'K')
    for (let y = 1; y <= 4; y++) {
      for (let x = 0; x < FLAPPY_GROUND_WIDTH; x++) g.px(x, y, (x + y * 2) % 8 < 4 ? 'G' : 'g')
    }
    g.rect(0, 5, FLAPPY_GROUND_WIDTH, 1, 'd')
    g.rect(0, 6, FLAPPY_GROUND_WIDTH, FLAPPY_GROUND_HEIGHT - 6, 'D')
    for (const [x, y] of [
      [3, 8],
      [11, 10],
      [7, 12],
    ] as const) {
      g.rect(x, y, 2, 1, 'd')
    }
  },
)

export const moon = compose('moon', 12, 12, { M: CANVAS.moon, s: CANVAS.moonShade }, (g) => {
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      if (Math.hypot(x - 5.5, y - 5.5) <= 5.6) g.px(x, y, 'M')
    }
  }
  g.rect(7, 3, 2, 2, 's')
  g.rect(3, 7, 3, 2, 's')
})

export const starBig = compose('star-big', 3, 3, { S: CANVAS.star }, (g) => {
  g.px(1, 0, 'S').px(0, 1, 'S').px(1, 1, 'S').px(2, 1, 'S').px(1, 2, 'S')
})
