import type { Stage } from '../engine/types'
import type { ControlMode } from '../hooks/useSettings'
import { ControlHints } from './ControlHints'
import { Button, Label, Modal } from './ui'

const TEXT_SHADOW = { textShadow: '4px 4px 0 var(--color-ink)' }

export function CountdownOverlay({
  seconds,
  stage,
  controlMode,
}: {
  seconds: number
  stage: Stage
  controlMode: ControlMode
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink/45 p-2">
      <Label className="text-paper" >Get ready</Label>
      <p
        key={seconds}
        className="animate-pop font-pixel text-6xl text-paper sm:text-7xl"
        style={TEXT_SHADOW}
        aria-live="assertive"
      >
        {seconds}
      </p>
      <div className="hidden px-3 sm:block">
        <ControlHints stage={stage} mode={controlMode} />
      </div>
    </div>
  )
}

export function TransitionBanner({ controlMode }: { controlMode: ControlMode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[18%] z-20 flex flex-col items-center gap-4 px-2">
      <p className="lcd animate-pop px-5 py-3 font-pixel text-xs sm:text-base">Level up: Flappy!</p>
      <div className="hidden sm:block">
        <ControlHints stage="flappy" mode={controlMode} />
      </div>
    </div>
  )
}

export function PauseOverlay({
  onResume,
  onRestart,
  onMenu,
}: {
  onResume: () => void
  onRestart: () => void
  onMenu: () => void
}) {
  return (
    <Modal title="Paused">
      <p className="mt-3 text-lg text-ink-soft">Press P or Esc to resume.</p>
      <div className="mt-6 flex flex-col items-stretch gap-3">
        <Button variant="primary" onClick={onResume} autoFocus>
          Resume
        </Button>
        <Button onClick={onRestart}>Restart</Button>
        <Button variant="ghost" onClick={onMenu}>
          Back to menu
        </Button>
      </div>
    </Modal>
  )
}
