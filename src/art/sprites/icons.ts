import { CANVAS, UI } from '../palette'
import { compose, type Grid } from '../compose'
import type { Sprite } from '../sprite'

const COLORS = {
  S: CANVAS.skin,
  s: CANVAS.skinDark,
  K: UI.ink,
  P: UI.paper,
  p: UI['paper-3'],
  G: UI['ink-soft'],
  Y: UI.yellow,
  O: UI.orange,
  C: CANVAS.cactus,
  c: CANVAS.cactusDark,
}

const SIZE = 16

function icon(name: string, draw: (g: Grid) => void): Sprite {
  return compose(`icon-${name}`, SIZE, SIZE, COLORS, draw)
}

function palm(g: Grid): void {
  g.rect(4, 8, 9, 6, 'S')
  g.rect(2, 9, 3, 3, 'S')
  g.rect(5, 12, 7, 1, 's')
}

function keycap(g: Grid, up: boolean): void {
  g.rect(0, 0, SIZE, SIZE, 'K')
  g.rect(1, 1, 14, 12, 'P')
  g.rect(1, 13, 14, 2, 'p')
  const rows: [number, number][] = [
    [7, 2],
    [6, 4],
    [5, 6],
    [4, 8],
  ]
  rows.forEach(([x, w], i) => {
    const y = up ? 3 + i : 10 - i
    g.rect(x, y, w, 1, 'K')
  })
  g.rect(6, up ? 7 : 3, 4, 4, 'K')
}

export const ICONS = {
  index: icon('index', (g) => {
    g.rect(7, 1, 3, 8, 'S')
    palm(g)
    g.outline('K')
  }),
  peace: icon('peace', (g) => {
    g.rect(5, 1, 3, 8, 'S')
    g.rect(9, 1, 3, 8, 'S')
    palm(g)
    g.outline('K')
  }),
  fist: icon('fist', (g) => {
    g.rect(3, 4, 10, 9, 'S')
    g.rect(2, 8, 3, 3, 'S')
    g.rect(4, 6, 8, 1, 's')
    g.rect(4, 9, 8, 1, 's')
    g.outline('K')
  }),
  keyUp: icon('key-up', (g) => keycap(g, true)),
  keyDown: icon('key-down', (g) => keycap(g, false)),
  camera: icon('camera', (g) => {
    g.rect(1, 5, 14, 9, 'G')
    g.rect(5, 3, 6, 2, 'G')
    g.rect(6, 7, 5, 5, 'P')
    g.rect(8, 9, 2, 2, 'K')
    g.rect(12, 6, 2, 1, 'O')
    g.outline('K')
  }),
  pause: icon('pause', (g) => {
    g.rect(4, 3, 3, 10, 'K')
    g.rect(9, 3, 3, 10, 'K')
  }),
  play: icon('play', (g) => {
    for (let y = 0; y < 12; y++) g.rect(4, 2 + y, (y < 6 ? y : 11 - y) + 1, 1, 'K')
  }),
  trophy: icon('trophy', (g) => {
    g.rect(4, 2, 8, 6, 'Y')
    g.rect(2, 3, 2, 3, 'Y')
    g.rect(12, 3, 2, 3, 'Y')
    g.rect(7, 8, 2, 3, 'Y')
    g.rect(5, 11, 6, 2, 'Y')
    g.outline('K')
  }),
  cactus: icon('cactus', (g) => {
    g.rect(6, 2, 4, 12, 'C')
    g.rect(2, 6, 4, 2, 'C')
    g.rect(2, 4, 2, 3, 'C')
    g.rect(10, 8, 4, 2, 'C')
    g.rect(12, 6, 2, 3, 'C')
    g.rect(9, 3, 1, 10, 'c')
    g.outline('K')
  }),
} as const

export type IconName = keyof typeof ICONS
