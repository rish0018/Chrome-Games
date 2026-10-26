import { useEffect, useRef, useState } from 'react'
import type { IconName } from '../art/sprites/icons'
import { averageRatios, computeThresholds, type CalibrationPose } from '../hand/calibration'
import type { FingerRatios } from '../hand/gesture'
import type { HandTracking } from '../hand/useHandTracking'
import { CameraPanel } from './CameraPanel'
import { PixelIcon } from './PixelSprite'
import { Button, Label, Modal } from './ui'

const POSES: { pose: CalibrationPose; icon: IconName; text: string }[] = [
  { pose: 'fist', icon: 'fist', text: 'Make a fist (all fingers curled)' },
  { pose: 'index', icon: 'index', text: 'Point with your index finger only' },
  { pose: 'peace', icon: 'peace', text: 'Raise index and middle fingers, curl the rest' },
]

const PREP_SECONDS = 3
const CAPTURE_MS = 1500
const MIN_SAMPLES = 10
const SEGMENTS = 10

type Phase = 'intro' | 'prep' | 'capture' | 'done' | 'error'

export function CalibrationModal({ tracking, onClose }: { tracking: HandTracking; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<Phase>('intro')
  const [count, setCount] = useState(PREP_SECONDS)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const captured = useRef<Partial<Record<CalibrationPose, FingerRatios>>>({})
  const { ratiosRef, applyCalibration } = tracking

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (phase !== 'prep') return
    let remaining = PREP_SECONDS
    setCount(remaining)
    const id = setInterval(() => {
      remaining--
      setCount(remaining)
      if (remaining <= 0) {
        clearInterval(id)
        setPhase('capture')
      }
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'capture') return
    const samples: FingerRatios[] = []
    const startedAt = performance.now()
    setProgress(0)

    const fail = (message: string) => {
      setError(message)
      setPhase('error')
    }

    const id = setInterval(() => {
      const ratios = ratiosRef.current
      if (ratios) samples.push({ ...ratios })
      const elapsed = (performance.now() - startedAt) / CAPTURE_MS
      setProgress(Math.min(1, elapsed))
      if (elapsed < 1) return
      clearInterval(id)

      const average = samples.length >= MIN_SAMPLES ? averageRatios(samples) : null
      if (!average) {
        fail('No hand detected. Keep your hand in view and try this pose again.')
        return
      }
      captured.current[POSES[step].pose] = average

      if (step < POSES.length - 1) {
        setStep(step + 1)
        setPhase('intro')
        return
      }
      const { fist, index, peace } = captured.current
      const thresholds = fist && index && peace ? computeThresholds({ fist, index, peace }) : null
      if (!thresholds) {
        captured.current = {}
        setStep(0)
        fail('Those poses looked too similar. Exaggerate each one and start again.')
        return
      }
      applyCalibration(thresholds)
      setPhase('done')
    }, 40)
    return () => clearInterval(id)
  }, [phase, step, ratiosRef, applyCalibration])

  const current = POSES[step]
  const filled = Math.round(progress * SEGMENTS)

  return (
    <div className="fixed inset-0 z-40">
      <Modal title="Calibrate" labelledBy="calibration-title">
        <div className="mt-5 flex flex-col items-center gap-4">
          <CameraPanel tracking={tracking} large />

          {phase === 'done' ? (
            <>
              <p className="lcd px-4 py-2 font-pixel text-xs">Saved</p>
              <p className="text-lg text-ink-soft">Open a practice cartridge to see it working.</p>
              <Button variant="primary" onClick={onClose} autoFocus>
                Done
              </Button>
            </>
          ) : (
            <>
              <Label className="text-ink-soft">
                Pose {step + 1} of {POSES.length}
              </Label>
              <p className="flex items-center gap-3 text-left text-xl leading-snug">
                <PixelIcon name={current.icon} scale={4} />
                {current.text}
              </p>

              {phase === 'prep' && (
                <p className="font-pixel text-5xl tabular-nums" style={{ textShadow: '4px 4px 0 var(--color-paper-3)' }} aria-live="assertive">
                  {count}
                </p>
              )}
              {phase === 'capture' && (
                <div
                  className="flex w-full gap-1"
                  role="progressbar"
                  aria-valuenow={Math.round(progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {Array.from({ length: SEGMENTS }, (_, i) => (
                    <span key={i} className={`h-4 flex-1 ${i < filled ? 'bg-lcd-dark' : 'bg-paper-3'}`} />
                  ))}
                </div>
              )}
              {phase === 'error' && (
                <p role="alert" className="px-box-flat bg-red p-3 text-lg text-paper">
                  {error}
                </p>
              )}

              {(phase === 'intro' || phase === 'error') && (
                <Button variant="primary" onClick={() => setPhase('prep')} autoFocus>
                  {phase === 'error' ? 'Try again' : "I'm ready"}
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
