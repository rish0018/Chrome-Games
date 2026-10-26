/** UI colours. Must match the `--color-*` tokens in src/index.css (enforced by palette.test.ts). */
export const UI = {
  paper: '#f3ead2',
  'paper-2': '#e7dbb8',
  'paper-3': '#d3c395',
  ink: '#1b2a1b',
  'ink-soft': '#3d523d',
  green: '#306230',
  lcd: '#9bbc0f',
  'lcd-dark': '#0f380f',
  sky: '#7fcff5',
  'sky-pale': '#cdeefc',
  orange: '#ef8a2a',
  red: '#d9473a',
  yellow: '#f7d44a',
} as const

/** Colours used only on the game canvas. */
export const CANVAS = {
  white: '#fffaf0',
  cloud: '#fffdf5',
  cloudShade: '#d9e8ee',

  dino: '#2d3b2d',
  dinoLight: '#4b5d4b',
  dinoEye: '#fffaf0',

  cactus: '#3f8f3f',
  cactusDark: '#2b6a2e',
  cactusLight: '#6fb25a',

  ptero: '#8a4b2a',
  pteroWing: '#c06a3a',
  pteroBeak: '#f2b13d',

  sand: '#d8b46a',
  sandDark: '#b98d45',
  dirt: '#8a5a2b',
  pebble: '#a47a3c',

  hillFar: '#a9dcaa',
  hillNear: '#82c58d',
  skylineFar: '#9bbfd8',
  skylineNear: '#7aa3c4',
  windowLit: '#fbe9a0',

  birdBody: '#f7d44a',
  birdWing: '#e8892b',
  birdBeak: '#e8452e',
  birdBelly: '#fff2c0',

  pipe: '#4fae45',
  pipeLight: '#86d46f',
  pipeDark: '#2d7a31',
  pipeOutline: '#17421c',

  skin: '#f2c08f',
  skinDark: '#d9985f',

  groundGrass: '#5fae4a',
  groundGrassDark: '#3f8a3a',
  groundDirt: '#d9a95f',
  groundDirtDark: '#b8843f',

  star: '#fff8d0',
  moon: '#f6efc7',
  moonShade: '#d9d1a0',
  dust: '#e8dcba',
  feather: '#f7d44a',
} as const

export type UiColor = keyof typeof UI
