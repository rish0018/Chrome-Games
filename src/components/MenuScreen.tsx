import type { ReactNode } from 'react'
import { dinoRunA, dinoStand } from '../art/sprites/dino'
import { flappyMid, flappyUp, pipeCap, pipeRow } from '../art/sprites/flappy'
import { pteroUp } from '../art/sprites/bird'
import { cloudBig, cloudSmall } from '../art/sprites/scenery'
import type { GameMode } from '../engine/types'
import type { HandTracking, TrackingStatus } from '../hand/useHandTracking'
import type { HighScores } from '../hooks/useHighScores'
import type { ControlMode, Settings } from '../hooks/useSettings'
import { MODE_INFO } from '../lib/modes'
import { CameraPanel } from './CameraPanel'
import { ControlHints } from './ControlHints'
import { PixelIcon, PixelSprite } from './PixelSprite'
import { Button, Label } from './ui'

interface MenuScreenProps {
  tracking: HandTracking
  settings: Settings
  scores: HighScores
  onPlay: (mode: GameMode) => void
  onControlMode: (mode: ControlMode) => void
  onCalibrate?: () => void
}

const STATUS_TONE: Record<TrackingStatus, string> = {
  idle: 'bg-paper-2 text-ink',
  loading: 'bg-lcd text-lcd-dark',
  ready: 'bg-lcd text-lcd-dark',
  denied: 'bg-red text-paper',
  'no-camera': 'bg-red text-paper',
  error: 'bg-red text-paper',
}

/** A pipe: cap on top, body repeating downward (a 1-row sprite stretched with pixelated rendering). */
function Pipe({ scale, height, className = "" }: { scale: number; height: string; className?: string }) {
  return (
    <span className={`flex flex-col items-center ${className}`} aria-hidden="true">
      <PixelSprite sprite={pipeCap} scale={scale} />
      <PixelSprite sprite={pipeRow} scale={scale} className={height} />
    </span>
  )
}

/** A tiny scene that shows what the game looks like before you start it. */
function HeroScene() {
  return (
    <div className="px-box relative hidden h-44 w-full max-w-sm overflow-hidden bg-sky sm:block" aria-hidden="true">
      <PixelSprite sprite={cloudBig} scale={3} className="absolute left-6 top-4" />
      <PixelSprite sprite={cloudSmall} scale={3} className="absolute right-8 top-10" />
      <PixelSprite sprite={flappyUp} scale={3} className="absolute right-6 top-20" />
      <PixelSprite sprite={pteroUp} scale={3} className="absolute left-32 top-14" />
      <div className="absolute inset-x-0 bottom-0 h-8 bg-[#d8b46a] border-t-4 border-[#b98d45]" />
      <PixelSprite sprite={dinoStand} scale={3} className="absolute bottom-8 left-5" />
      <Pipe scale={3} height="h-10" className="absolute bottom-8 right-24" />
    </div>
  )
}

interface CartridgeProps {
  mode: GameMode
  score: number
  featured?: boolean
  label: string
  art: ReactNode
  onPlay: (mode: GameMode) => void
}

function Cartridge({ mode, score, featured, label, art, onPlay }: CartridgeProps) {
  const info = MODE_INFO[mode]
  return (
    <button
      type="button"
      onClick={() => onPlay(mode)}
      className={`px-box group flex flex-col text-left transition-transform hover:-translate-y-1 active:translate-y-1 ${
        featured ? 'sm:col-span-2 sm:flex-row' : ''
      }`}
    >
      <span
        className={`flex items-end justify-center gap-3 p-4 ${label} ${
          featured ? 'min-h-32 sm:w-2/5 sm:min-h-0' : 'min-h-28'
        } border-b-4 border-ink ${featured ? 'sm:border-b-0 sm:border-r-4' : ''}`}
      >
        {art}
      </span>
      <span className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <span>
          <span className={`block font-pixel leading-snug ${featured ? 'text-base sm:text-lg' : 'text-sm'}`}>
            {info.title}
          </span>
          <span className="mt-2 block text-base text-ink-soft">{info.blurb}</span>
        </span>
        <span className="mt-auto flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-pixel text-xs">
            <PixelIcon name="play" scale={2} />
            {featured ? 'Play' : 'Practice'}
          </span>
          <span className="lcd px-3 py-1.5 font-pixel text-[10px]">BEST {String(score).padStart(5, '0')}</span>
        </span>
      </span>
    </button>
  )
}

export function MenuScreen({ tracking, settings, scores, onPlay, onControlMode, onCalibrate }: MenuScreenProps) {
  const gestureMode = settings.controlMode === 'gesture'
  const cameraOn = tracking.status === 'ready'
  const busy = tracking.status === 'loading'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col gap-10 px-5 py-8 sm:py-12">
      <header className="animate-rise flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
        <div className="max-w-md">
          <Label className="lcd inline-block px-3 py-1.5">Hand-controlled arcade</Label>
          <h1 className="mt-5 text-2xl leading-tight sm:text-4xl">GesturePlay</h1>
          <p className="mt-4 text-xl leading-snug text-ink-soft">
            Run the dino. Hit 2000 points and the world flips into Flappy Bird. Steer with your fingers through the
            webcam, or with the keyboard.
          </p>
        </div>
        <HeroScene />
      </header>

      <section aria-labelledby="modes" className="animate-rise [animation-delay:80ms]">
        <h2 id="modes" className="mb-5 text-sm sm:text-base">
          Pick a cartridge
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Cartridge
            mode="journey"
            score={scores.journey}
            featured
            label="bg-orange"
            onPlay={onPlay}
            art={
              <>
                <PixelSprite sprite={dinoRunA} scale={3} />
                <span className="mb-4 font-pixel text-sm text-ink">&gt;&gt;</span>
                <PixelSprite sprite={flappyMid} scale={3} className="mb-6" />
              </>
            }
          />
          <Cartridge
            mode="dino"
            score={scores.dino}
            label="bg-paper-3"
            onPlay={onPlay}
            art={
              <>
                <PixelSprite sprite={dinoRunA} scale={3} />
                <PixelIcon name="cactus" scale={4} />
              </>
            }
          />
          <Cartridge
            mode="flappy"
            score={scores.flappy}
            label="bg-sky"
            onPlay={onPlay}
            art={
              <>
                <PixelSprite sprite={flappyUp} scale={3} className="mb-6" />
                <Pipe scale={2} height="h-10" />
              </>
            }
          />
        </div>
      </section>

      <section
        aria-labelledby="controls"
        className="px-box animate-rise bg-paper p-5 [animation-delay:160ms] sm:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="controls" className="text-sm sm:text-base">
            Controls
          </h2>
          <div role="radiogroup" aria-label="Control mode" className="flex">
            {(['gesture', 'manual'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={settings.controlMode === value}
                data-variant={settings.controlMode === value ? 'green' : 'secondary'}
                onClick={() => onControlMode(value)}
                className="px-btn"
              >
                {value === 'gesture' ? 'Gesture' : 'Manual'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <ControlHints stage="dino" mode={settings.controlMode} />
        </div>

        {gestureMode && (
          <div className="mt-8 flex flex-col items-start gap-5 border-t-4 border-dashed border-paper-3 pt-6">
            <p
              className={`px-box-flat flex w-full max-w-lg items-center gap-3 px-4 py-3 font-pixel text-[11px] leading-relaxed ${STATUS_TONE[tracking.status]}`}
              role="status"
            >
              <span className={`size-3 shrink-0 bg-current ${busy ? 'animate-blink' : ''}`} aria-hidden="true" />
              {tracking.message}
            </p>
            <div className="flex flex-wrap gap-3">
              {cameraOn ? (
                <Button onClick={tracking.stop}>
                  <PixelIcon name="camera" scale={2} />
                  Camera off
                </Button>
              ) : (
                <Button variant="primary" onClick={() => void tracking.start()} disabled={busy}>
                  <PixelIcon name="camera" scale={2} />
                  {busy ? 'Starting' : 'Enable camera'}
                </Button>
              )}
              {onCalibrate && (
                <Button onClick={onCalibrate} disabled={!cameraOn}>
                  {tracking.calibrated ? 'Recalibrate' : 'Calibrate'}
                </Button>
              )}
            </div>
            {cameraOn && (
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
                <CameraPanel tracking={tracking} large />
                <p className="max-w-xs text-base text-ink-soft">
                  Open a practice cartridge to check that the skeleton follows your hand and the label changes with your
                  fingers.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="pb-4 text-base text-ink-soft">
        Camera video never leaves your device. P or Esc pauses, R restarts.
      </footer>
    </main>
  )
}
