import type { GameMode } from '../engine/types'

export const MODE_INFO: Record<GameMode, { short: string; title: string; blurb: string }> = {
  journey: {
    short: 'Journey',
    title: 'Dino to Flappy',
    blurb: 'Run as the dino. At 2000 points the world flips into Flappy Bird.',
  },
  dino: {
    short: 'Dino practice',
    title: 'Dino only',
    blurb: 'Endless runner with the hand skeleton on screen. Good for checking your gestures.',
  },
  flappy: {
    short: 'Flappy practice',
    title: 'Flappy only',
    blurb: 'Fly through the pipes with the hand skeleton on screen. Good for checking your gestures.',
  },
}
