import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import type { Game } from '../engine/game'
import { SceneRenderer, prepareCanvas } from '../engine/render/scene'
import type { InputState, Stage } from '../engine/types'

export interface Hud {
  score: number
  stage: Stage
  countdown: number
  /** Flappy stage is waiting for the first flap. */
  waiting: boolean
}

interface GameCanvasProps {
  game: Game
  getInput: () => InputState
  onHud: (hud: Hud) => void
  pointer?: {
    press: (direction: 'up' | 'down') => void
    release: (direction: 'up' | 'down') => void
  }
}

export function GameCanvas({ game, getInput, onHud, pointer }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latest = useRef({ getInput, onHud })
  const activeDirection = useRef<'up' | 'down' | null>(null)

  useEffect(() => {
    latest.current = { getInput, onHud }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = prepareCanvas(canvas)
    if (!ctx) return
    const renderer = new SceneRenderer(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    let frame = 0
    let last = performance.now()
    let shown: Hud = { score: -1, stage: game.stage, countdown: -1, waiting: false }

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      const dt = now - last
      last = now
      game.update(dt, latest.current.getInput())
      renderer.render(ctx, game, now, dt)

      const hud: Hud = {
        score: Math.floor(game.score),
        stage: game.stage,
        countdown: game.countdownSeconds,
        waiting: game.stage === 'flappy' && !game.flappy.started,
      }
      if (
        hud.score !== shown.score ||
        hud.stage !== shown.stage ||
        hud.countdown !== shown.countdown ||
        hud.waiting !== shown.waiting
      ) {
        shown = hud
        latest.current.onHud(hud)
      }
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [game])

  const release = () => {
    if (activeDirection.current) pointer?.release(activeDirection.current)
    activeDirection.current = null
  }

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!pointer) return
    const rect = event.currentTarget.getBoundingClientRect()
    const lowerBand = event.clientY - rect.top > rect.height * 0.7
    release()
    activeDirection.current = lowerBand ? 'down' : 'up'
    pointer.press(activeDirection.current)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={200}
      className="pixelated block aspect-[2/1] w-full touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      aria-label="Game canvas"
    />
  )
}
