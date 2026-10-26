import type { IconName } from '../art/sprites/icons'
import type { Stage } from '../engine/types'
import type { ControlMode } from '../hooks/useSettings'
import { PixelIcon } from './PixelSprite'

interface Hint {
  icon: IconName
  name: string
  action: string
}

export function controlHints(stage: Stage, mode: ControlMode): Hint[] {
  const up = stage === 'dino' ? 'Jump' : 'Flap up'
  const down = stage === 'dino' ? 'Duck' : 'Dive'
  if (mode === 'gesture') {
    return [
      { icon: 'index', name: 'Index finger', action: up },
      { icon: 'peace', name: 'Index + middle', action: down },
    ]
  }
  return [
    { icon: 'keyUp', name: 'Space / Up / tap', action: up },
    { icon: 'keyDown', name: 'Down / S / tap low', action: down },
  ]
}

export function ControlHints({ stage, mode }: { stage: Stage; mode: ControlMode }) {
  return (
    <ul className="flex flex-wrap gap-4">
      {controlHints(stage, mode).map((hint) => (
        <li key={hint.name} className="px-box-flat flex items-center gap-3 bg-paper-2 p-3 pr-4 text-left">
          <PixelIcon name={hint.icon} scale={3} />
          <span>
            <span className="block text-sm text-ink-soft">{hint.name}</span>
            <span className="block font-pixel text-xs">{hint.action}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
