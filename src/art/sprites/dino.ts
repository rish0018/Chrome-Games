import { CANVAS, UI } from '../palette'
import { compose, type Grid } from '../compose'

const COLORS = {
  D: CANVAS.dino,
  L: CANVAS.dinoLight,
  E: CANVAS.dinoEye,
  K: UI.ink,
}

type Legs = 'both' | 'leftUp' | 'rightUp'

function leg(g: Grid, x: number, raised: boolean): void {
  if (raised) {
    g.rect(x, 23, 4, 3, 'D')
    g.rect(x, 25, 5, 1, 'D')
  } else {
    g.rect(x, 23, 4, 6, 'D')
    g.rect(x, 28, 6, 2, 'D')
  }
}

function standing(g: Grid, legs: Legs, dead: boolean): void {
  // head: rounded top, snout stepping out to the right, light mouth line
  g.rect(15, 0, 13, 7, 'D')
  g.rect(15, 7, 15, 3, 'D')
  g.rect(22, 8, 8, 1, 'L')
  g.px(15, 0, '.').px(27, 0, '.')
  // neck
  g.rect(15, 10, 8, 3, 'D')
  // body with a rounded back and small spikes
  g.rect(5, 12, 19, 10, 'D')
  g.px(5, 12, '.')
  g.px(8, 11, 'D').px(12, 11, 'D').px(16, 11, 'D')
  g.rect(8, 19, 13, 3, 'L')
  // tail tapering to a point
  g.rect(2, 13, 4, 3, 'D')
  g.rect(0, 14, 3, 2, 'D')
  g.rect(3, 16, 3, 2, 'D')
  // arm
  g.rect(23, 16, 4, 2, 'D')
  g.px(26, 18, 'D')
  // thighs
  g.rect(7, 21, 6, 2, 'D')
  g.rect(15, 21, 6, 2, 'D')
  // eye
  if (dead) {
    g.px(20, 2, 'E').px(22, 2, 'E').px(21, 3, 'E').px(20, 4, 'E').px(22, 4, 'E')
  } else {
    g.rect(20, 2, 3, 3, 'E')
    g.px(22, 3, 'K')
  }
  leg(g, 8, legs === 'leftUp')
  leg(g, 16, legs === 'rightUp')
}

/** 30x30 art pixels = the 60x60 standing hitbox at the 2x art scale. */
export const dinoStand = compose('dino-stand', 30, 30, COLORS, (g) => standing(g, 'both', false))
export const dinoRunA = compose('dino-run-a', 30, 30, COLORS, (g) => standing(g, 'rightUp', false))
export const dinoRunB = compose('dino-run-b', 30, 30, COLORS, (g) => standing(g, 'leftUp', false))
export const dinoDead = compose('dino-dead', 30, 30, COLORS, (g) => standing(g, 'both', true))

function ducking(g: Grid, frame: 'a' | 'b'): void {
  g.rect(24, 0, 10, 7, 'D')
  g.rect(29, 2, 2, 2, 'E')
  g.px(30, 3, 'K')
  g.rect(28, 5, 5, 1, 'L')
  g.rect(2, 3, 24, 8, 'D')
  g.rect(4, 9, 18, 2, 'L')
  g.rect(0, 4, 3, 4, 'D')
  const a = frame === 'a'
  g.rect(8, 11, 4, a ? 4 : 2, 'D')
  g.rect(8, a ? 14 : 12, 6, 1, 'D')
  g.rect(18, 11, 4, a ? 2 : 4, 'D')
  g.rect(18, a ? 12 : 14, 6, 1, 'D')
}

/** 34x15 art pixels; the body is 60x30 hitbox wide and the head leans a few pixels forward. */
export const dinoDuckA = compose('dino-duck-a', 34, 15, COLORS, (g) => ducking(g, 'a'))
export const dinoDuckB = compose('dino-duck-b', 34, 15, COLORS, (g) => ducking(g, 'b'))
