import { useEffect, useRef } from 'react'
import { HandLandmarker } from '@mediapipe/tasks-vision'
import { UI } from '../art/palette'
import type { HandTracking } from '../hand/useHandTracking'
import type { Gesture } from '../hand/gesture'

const GESTURE_LABEL: Record<Gesture, string> = {
  index: 'Index = up',
  peace: 'Peace = down',
  none: 'No gesture',
}

const FINGERTIPS = new Set([4, 8, 12, 16, 20])

interface CameraPanelProps {
  tracking: HandTracking
  large?: boolean
  showSkeleton?: boolean
}

export function CameraPanel({ tracking, large = false, showSkeleton = true }: CameraPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { status, video, landmarksRef } = tracking

  useEffect(() => {
    if (status !== 'ready') return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    let frame = 0

    const draw = () => {
      frame = requestAnimationFrame(draw)
      if (video.readyState < 2) return
      const { width, height } = canvas
      ctx.drawImage(video, 0, 0, width, height)
      const hand = landmarksRef.current
      if (!showSkeleton || !hand) return

      ctx.lineWidth = 4
      ctx.lineCap = 'square'
      ctx.strokeStyle = UI.lcd
      for (const { start, end } of HandLandmarker.HAND_CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(Math.round(hand[start].x * width), Math.round(hand[start].y * height))
        ctx.lineTo(Math.round(hand[end].x * width), Math.round(hand[end].y * height))
        ctx.stroke()
      }
      hand.forEach((point, i) => {
        const tip = FINGERTIPS.has(i)
        const size = tip ? 14 : 8
        ctx.fillStyle = i === 8 ? UI.orange : i === 12 ? UI.yellow : tip ? UI.paper : UI.ink
        ctx.fillRect(Math.round(point.x * width - size / 2), Math.round(point.y * height - size / 2), size, size)
      })
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [status, video, landmarksRef, showSkeleton])

  if (status !== 'ready') return null

  const label = tracking.handVisible ? GESTURE_LABEL[tracking.gesture] : 'No hand'
  const active = tracking.handVisible && tracking.gesture !== 'none'

  return (
    <figure className={`px-box-flat m-1 overflow-hidden bg-ink ${large ? 'w-full max-w-sm' : 'w-40 sm:w-48'}`}>
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="pixelated block w-full -scale-x-100"
        aria-label="Camera preview with hand tracking"
      />
      <figcaption
        className={`px-2 py-1.5 text-center font-pixel text-[10px] uppercase ${active ? 'bg-lcd text-lcd-dark' : 'bg-paper-2 text-ink'}`}
        aria-live="polite"
      >
        {label}
      </figcaption>
    </figure>
  )
}
