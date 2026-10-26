import { useCallback, useEffect, useRef, useState } from 'react'
import { Game } from '../engine/game'
import type { GameMode, InputState, Phase } from '../engine/types'
import type { HandTracking } from '../hand/useHandTracking'
import { useKeyboardInput } from '../hooks/useKeyboardInput'
import { useSnappedWidth } from '../hooks/useSnappedWidth'
import type { ControlMode } from '../hooks/useSettings'
import { MODE_INFO } from '../lib/modes'
import { CameraPanel } from './CameraPanel'
import { GameCanvas, type Hud } from './GameCanvas'
import { GameOverModal } from './GameOverModal'
import { CountdownOverlay, PauseOverlay, TransitionBanner } from './Overlays'
import { PixelIcon } from './PixelSprite'
import { Button, Label } from './ui'

interface GameScreenProps {
  mode: GameMode
  controlMode: ControlMode
  tracking: HandTracking
  best: number
  onSubmitScore: (mode: GameMode, score: number) => boolean
  onChangeMode: (mode: GameMode) => void
  onSwitchToManual: () => void
  onExit: () => void
}

interface Result {
  score: number
  best: number
  isBest: boolean
}

const pad = (n: number) => String(n).padStart(5, '0')

export function GameScreen({
  mode,
  controlMode,
  tracking,
  best,
  onSubmitScore,
  onChangeMode,
  onSwitchToManual,
  onExit,
}: GameScreenProps) {
  const [game] = useState(() => new Game(mode))
  const [phase, setPhase] = useState<Phase>('countdown')
  const [hud, setHud] = useState<Hud>({ score: 0, stage: game.stage, countdown: 3, waiting: false })
  const [result, setResult] = useState<Result | null>(null)
  const manual = useKeyboardInput(controlMode === 'manual')
  const stage = useSnappedWidth(400)

  const latest = useRef({ onSubmitScore, best })
  useEffect(() => {
    latest.current = { onSubmitScore, best }
  })

  const scratch = useRef<InputState>({ up: false, down: false })
  const { gestureRef } = tracking
  const getInput = useCallback((): InputState => {
    if (controlMode === 'manual') return manual.inputRef.current
    scratch.current.up = gestureRef.current === 'index'
    scratch.current.down = gestureRef.current === 'peace'
    return scratch.current
  }, [controlMode, gestureRef, manual.inputRef])

  useEffect(() => {
    game.onPhaseChange = (next) => {
      setPhase(next)
      if (next !== 'over') return
      const score = Math.floor(game.score)
      const previousBest = latest.current.best
      const isBest = latest.current.onSubmitScore(mode, score)
      setResult({ score, best: Math.max(previousBest, score), isBest })
    }
    return () => {
      game.onPhaseChange = undefined
    }
  }, [game, mode])

  const restart = useCallback(() => {
    setResult(null)
    game.restart()
  }, [game])

  const togglePause = useCallback(() => {
    if (game.phase === 'paused') game.resume()
    else game.pause()
  }, [game])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.key === 'p' || event.key === 'P' || event.key === 'Escape') togglePause()
      else if (event.key === 'r' || event.key === 'R') restart()
    }
    const onVisibility = () => {
      if (document.hidden) game.pause()
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [game, restart, togglePause])

  const practice = mode !== 'journey'
  const cameraLost = controlMode === 'gesture' && tracking.status !== 'ready'
  const gestureText = !tracking.handVisible
    ? 'No hand'
    : tracking.gesture === 'index'
      ? 'Up'
      : tracking.gesture === 'peace'
        ? 'Down'
        : 'Ready'
  const gestureActive = tracking.handVisible && tracking.gesture !== 'none'

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-5 px-4 py-4 sm:py-6">
      <header className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onExit} aria-label="Back to menu">
          &lt; Menu
        </Button>
        <Label className="hidden text-ink-soft sm:block">{MODE_INFO[mode].title}</Label>
        <Button onClick={togglePause} aria-label="Pause game" disabled={phase === 'over'}>
          <PixelIcon name="pause" scale={2} />
          Pause
        </Button>
      </header>

      {cameraLost && (
        <div role="alert" className="px-box-flat flex flex-wrap items-center justify-between gap-3 bg-yellow p-4 text-lg">
          <span>{tracking.status === 'loading' ? 'Camera is starting...' : tracking.message}</span>
          <span className="flex gap-2">
            {tracking.status !== 'loading' && (
              <Button onClick={() => void tracking.start()} className="!min-h-10 !py-2">
                Enable camera
              </Button>
            )}
            <Button variant="green" onClick={onSwitchToManual} className="!min-h-10 !py-2">
              Use keyboard
            </Button>
          </span>
        </div>
      )}

      <div ref={stage.ref} className="w-full">
        <div style={{ width: stage.width }} className="px-box-flat relative mx-auto overflow-hidden bg-ink">
          <GameCanvas
            game={game}
            getInput={getInput}
            onHud={setHud}
            pointer={controlMode === 'manual' ? manual : undefined}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 sm:p-3">
            <span
              className={`px-box-flat m-0 px-2.5 py-1.5 font-pixel text-[10px] uppercase sm:text-xs ${
                controlMode === 'gesture' && gestureActive ? 'bg-lcd text-lcd-dark' : 'bg-paper-2 text-ink'
              }`}
            >
              {controlMode === 'gesture' ? gestureText : 'Keys'}
            </span>
            <div className="lcd m-0 px-3 py-2 text-right" aria-label={`Score ${hud.score}`}>
              <p className="font-pixel text-sm tabular-nums sm:text-lg">{pad(hud.score)}</p>
              <p className="mt-1 font-pixel text-[9px] tabular-nums opacity-80">HI {pad(Math.max(best, result?.best ?? 0))}</p>
            </div>
          </div>

          {phase === 'countdown' && (
            <CountdownOverlay seconds={hud.countdown} stage={hud.stage} controlMode={controlMode} />
          )}
          {phase === 'transition' && <TransitionBanner controlMode={controlMode} />}
          {phase === 'playing' && hud.waiting && (
            <p className="pointer-events-none absolute inset-x-0 top-[24%] z-10 flex justify-center px-2">
              <span className="lcd animate-pop m-0 px-4 py-2 text-center font-pixel text-[10px] leading-relaxed sm:text-xs">
                {controlMode === 'gesture' ? 'Raise your index finger to start' : 'Press Space or tap to start'}
              </span>
            </p>
          )}
          {phase === 'paused' && <PauseOverlay onResume={() => game.resume()} onRestart={restart} onMenu={onExit} />}
          {phase === 'over' && result && (
            <GameOverModal
              mode={mode}
              score={result.score}
              best={result.best}
              isBest={result.isBest}
              onRetry={restart}
              onSwitchMode={onChangeMode}
              onMenu={onExit}
            />
          )}
        </div>
      </div>

      {controlMode === 'gesture' && tracking.status === 'ready' && (
        <div className={practice ? 'flex flex-col items-start gap-2' : 'fixed bottom-3 right-3 z-10'}>
          <CameraPanel tracking={tracking} large={practice} showSkeleton />
          {practice && (
            <p className="max-w-md text-base text-ink-soft">
              If the skeleton follows your hand and the label changes when you switch fingers, your gestures are
              configured. Not right? Go back and calibrate.
            </p>
          )}
        </div>
      )}
    </main>
  )
}
