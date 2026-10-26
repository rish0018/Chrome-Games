import { CANVAS } from '../palette'
import { compose } from '../compose'

const COLORS = {
  C: CANVAS.cactus,
  l: CANVAS.cactusLight,
  d: CANVAS.cactusDark,
}

/*
 * Cacti have any height between 25 and 45 art pixels, so they are assembled from a cap,
 * a repeating row and a base. Everything stays inside the 15-pixel (30px) hitbox width.
 */
export const CACTUS_WIDTH = 15

export const cactusCap = compose('cactus-cap', 15, 2, COLORS, (g) => {
  g.rect(5, 0, 5, 1, 'C')
  g.rect(4, 1, 7, 1, 'C')
  g.px(5, 0, 'l').px(5, 1, 'l')
})

export const cactusRow = compose('cactus-row', 15, 1, COLORS, (g) => {
  g.rect(4, 0, 7, 1, 'C')
  g.px(5, 0, 'l')
  g.px(10, 0, 'd')
})

export const cactusBase = compose('cactus-base', 15, 1, COLORS, (g) => {
  g.rect(3, 0, 9, 1, 'd')
})

export const cactusArmLeft = compose('cactus-arm-left', 5, 8, COLORS, (g) => {
  g.rect(0, 0, 2, 6, 'C')
  g.rect(0, 5, 5, 2, 'C')
  g.px(0, 0, 'l')
  g.px(0, 1, 'l')
})

export const cactusArmRight = compose('cactus-arm-right', 5, 8, COLORS, (g) => {
  g.rect(3, 0, 2, 6, 'C')
  g.rect(0, 5, 5, 2, 'C')
  g.px(3, 0, 'l')
  g.px(3, 1, 'l')
})
