import { CANVAS, UI } from '../palette'
import { compose, type Grid } from '../compose'

const COLORS = {
  Y: CANVAS.birdBody,
  O: CANVAS.birdWing,
  R: CANVAS.birdBeak,
  B: CANVAS.birdBelly,
  W: CANVAS.white,
  K: UI.ink,
}

type Wing = 'up' | 'mid' | 'down'

function flappyBird(g: Grid, wing: Wing): void {
  // rounded body
  g.rect(6, 1, 7, 1, 'Y')
  g.rect(4, 2, 11, 1, 'Y')
  g.rect(2, 3, 15, 9, 'Y')
  g.rect(4, 12, 11, 1, 'Y')
  g.rect(6, 13, 7, 1, 'Y')
  // belly
  g.rect(6, 10, 9, 2, 'B')
  g.rect(8, 12, 5, 1, 'B')
  // eye
  g.rect(11, 3, 4, 4, 'W')
  g.rect(13, 4, 2, 2, 'K')
  // beak
  g.rect(16, 6, 3, 2, 'R')
  g.rect(16, 8, 3, 2, 'R')
  // wing
  const wingY = wing === 'up' ? 4 : wing === 'mid' ? 6 : 8
  g.rect(3, wingY, 7, 3, 'O')
  g.rect(2, wingY + 1, 2, 2, 'O')
  g.outline('K')
}

/** 20x15 art pixels = the 40x30 bird hitbox at the 2x art scale. */
export const flappyUp = compose('flappy-up', 20, 15, COLORS, (g) => flappyBird(g, 'up'))
export const flappyMid = compose('flappy-mid', 20, 15, COLORS, (g) => flappyBird(g, 'mid'))
export const flappyDown = compose('flappy-down', 20, 15, COLORS, (g) => flappyBird(g, 'down'))

const PIPE_COLORS = {
  P: CANVAS.pipe,
  l: CANVAS.pipeLight,
  d: CANVAS.pipeDark,
  K: CANVAS.pipeOutline,
}

/** 30 art pixels wide = the 60px pipe hitbox. Repeated vertically to any height. */
export const PIPE_WIDTH = 30
export const pipeRow = compose('pipe-row', 30, 1, PIPE_COLORS, (g) => {
  g.px(0, 0, 'K').px(29, 0, 'K')
  g.rect(1, 0, 28, 1, 'P')
  g.rect(3, 0, 3, 1, 'l')
  g.rect(24, 0, 4, 1, 'd')
})

/** 34 wide: 2 art pixels (4px) wider than the pipe on each side. */
export const PIPE_CAP_WIDTH = 34
export const PIPE_CAP_HEIGHT = 12
export const pipeCap = compose('pipe-cap', 34, 12, PIPE_COLORS, (g) => {
  g.rect(0, 0, 34, 12, 'K')
  g.rect(1, 1, 32, 10, 'P')
  g.rect(3, 1, 3, 10, 'l')
  g.rect(27, 1, 6, 10, 'd')
  g.rect(1, 1, 32, 1, 'l')
})
