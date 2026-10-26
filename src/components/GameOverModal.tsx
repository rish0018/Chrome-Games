import type { GameMode } from '../engine/types'
import { MODE_INFO } from '../lib/modes'
import { PixelIcon } from './PixelSprite'
import { Button, Label, Modal } from './ui'

interface GameOverModalProps {
  mode: GameMode
  score: number
  best: number
  isBest: boolean
  onRetry: () => void
  onSwitchMode: (mode: GameMode) => void
  onMenu: () => void
}

export function GameOverModal({ mode, score, best, isBest, onRetry, onSwitchMode, onMenu }: GameOverModalProps) {
  const others = (Object.keys(MODE_INFO) as GameMode[]).filter((m) => m !== mode)
  return (
    <Modal title={<span className="text-red">Game over</span>}>
      {isBest && (
        <p className="lcd animate-blink mt-4 inline-flex items-center gap-2 px-3 py-1.5 font-pixel text-[10px]">
          <PixelIcon name="trophy" scale={2} />
          New best!
        </p>
      )}
      <Label className="mt-5 text-ink-soft">Score</Label>
      <p className="mt-1 font-pixel text-4xl tabular-nums sm:text-5xl">{score}</p>
      <p className="mt-3 text-lg text-ink-soft">
        Best in {MODE_INFO[mode].short}: <span className="font-semibold text-ink">{best}</span>
      </p>
      <div className="mt-6 flex flex-col items-stretch gap-3">
        <Button variant="primary" onClick={onRetry} autoFocus>
          Retry
        </Button>
        <div className="grid grid-cols-2 gap-2">
          {others.map((m) => (
            <Button key={m} onClick={() => onSwitchMode(m)} className="!px-2 !text-[10px]">
              {MODE_INFO[m].short}
            </Button>
          ))}
        </div>
        <Button variant="ghost" onClick={onMenu}>
          Back to menu
        </Button>
      </div>
    </Modal>
  )
}
