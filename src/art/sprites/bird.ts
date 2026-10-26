import { CANVAS, UI } from '../palette'
import { compose, type Grid } from '../compose'

const COLORS = {
  P: CANVAS.ptero,
  W: CANVAS.pteroWing,
  B: CANVAS.pteroBeak,
  E: CANVAS.dinoEye,
  K: UI.ink,
}

function ptero(g: Grid, wingsUp: boolean): void {
  // head, beak, eye
  g.rect(2, 5, 5, 4, 'P')
  g.rect(0, 7, 3, 1, 'B')
  g.px(3, 6, 'E')
  g.px(4, 6, 'K')
  // body and tail
  g.rect(6, 6, 9, 4, 'P')
  g.rect(15, 7, 5, 2, 'P')
  g.rect(8, 9, 5, 1, 'W')
  if (wingsUp) {
    g.rect(9, 1, 4, 5, 'W')
    g.rect(7, 3, 2, 3, 'W')
    g.rect(13, 3, 3, 3, 'W')
  } else {
    g.rect(8, 10, 6, 3, 'W')
    g.rect(10, 13, 4, 2, 'W')
    g.rect(6, 10, 2, 2, 'W')
  }
}

/** 20x15 art pixels = the 40x30 bird hitbox at the 2x art scale. */
export const pteroUp = compose('ptero-up', 20, 15, COLORS, (g) => ptero(g, true))
export const pteroDown = compose('ptero-down', 20, 15, COLORS, (g) => ptero(g, false))
