import { describe, expect, it } from 'vitest'
import { registeredSprites } from '../sprite'
import { DINO, FLAPPY } from '../../engine/constants'
import { flappyDown, flappyMid, flappyUp, pipeRow, PIPE_CAP_WIDTH, PIPE_WIDTH } from './flappy'
import {
  FLAPPY_GROUND_WIDTH,
  GROUND_TILE_WIDTH,
  HILL_PERIOD,
  SKYLINE_WIDTH,
  groundDino,
  groundFlappy,
  hillsFar,
  hillsNear,
  skyline,
} from './scenery'
import { ICONS } from './icons'
import { dinoDead, dinoDuckA, dinoDuckB, dinoRunA, dinoRunB, dinoStand } from './dino'
import { CACTUS_WIDTH } from './cactus'
import { pteroDown, pteroUp } from './bird'

/** Engine units are 2x art pixels. */
const ART = 2

describe('sprites match engine hitboxes', () => {
  it('standing dino frames fill the 60x60 hitbox', () => {
    for (const s of [dinoStand, dinoRunA, dinoRunB, dinoDead]) {
      expect(s.width * ART).toBe(DINO.width)
      expect(s.height * ART).toBe(DINO.standHeight)
    }
  })

  it('ducking dino frames match the 30px duck height', () => {
    for (const s of [dinoDuckA, dinoDuckB]) expect(s.height * ART).toBe(DINO.duckHeight)
  })

  it('pterodactyl frames fill the 40x30 bird hitbox', () => {
    for (const s of [pteroUp, pteroDown]) {
      expect(s.width * ART).toBe(40)
      expect(s.height * ART).toBe(30)
    }
  })

  it('cactus parts stay inside the 30px hitbox width', () => {
    expect(CACTUS_WIDTH * ART).toBe(30)
  })
})

describe('flappy sprites match engine hitboxes', () => {
  it('bird frames fill the 40x30 bird hitbox', () => {
    for (const s of [flappyUp, flappyMid, flappyDown]) {
      expect(s.width * ART).toBe(FLAPPY.birdWidth)
      expect(s.height * ART).toBe(FLAPPY.birdHeight)
    }
  })

  it('pipe rows match the pipe width and the cap overhangs by 4px per side', () => {
    expect(pipeRow.width * ART).toBe(FLAPPY.pipeWidth)
    expect(PIPE_WIDTH * ART).toBe(FLAPPY.pipeWidth)
    expect((PIPE_CAP_WIDTH - PIPE_WIDTH) * ART).toBe(8)
  })
})

describe('scenery tiles', () => {
  it('are sized so they can repeat seamlessly', () => {
    expect(hillsFar.width).toBe(HILL_PERIOD)
    expect(hillsNear.width).toBe(HILL_PERIOD)
    expect(skyline.width).toBe(SKYLINE_WIDTH)
    expect(groundDino.width).toBe(GROUND_TILE_WIDTH)
    expect(groundFlappy.width).toBe(FLAPPY_GROUND_WIDTH)
  })
})

describe('icons', () => {
  it('are all 16x16', () => {
    for (const [name, s] of Object.entries(ICONS)) {
      expect(s.width, name).toBe(16)
      expect(s.height, name).toBe(16)
    }
  })
})

describe('sprite registry', () => {
  it('only contains non-empty sprites with unique names', () => {
    const sprites = registeredSprites()
    expect(sprites.length).toBeGreaterThan(0)
    const names = sprites.map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
    for (const s of sprites) {
      expect(s.pixels.some((p) => p !== null), s.name).toBe(true)
      expect(s.pixels.length).toBe(s.width * s.height)
    }
  })
})

