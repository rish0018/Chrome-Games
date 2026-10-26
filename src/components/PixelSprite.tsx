import { useMemo } from 'react'
import { spriteToDataUrl, type Sprite } from '../art/sprite'
import { ICONS, type IconName } from '../art/sprites/icons'

interface PixelSpriteProps {
  sprite: Sprite
  /** Integer multiplier applied to the sprite's pixels. */
  scale?: number
  flip?: boolean
  className?: string
}

/** Renders a sprite as a crisp <img>. Decorative: hidden from assistive tech. */
export function PixelSprite({ sprite, scale = 3, flip = false, className = '' }: PixelSpriteProps) {
  const src = useMemo(() => spriteToDataUrl(sprite, 1), [sprite])
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={sprite.width * scale}
      height={sprite.height * scale}
      className={`pixelated inline-block shrink-0 ${flip ? '-scale-x-100' : ''} ${className}`}
    />
  )
}

export function PixelIcon({ name, scale = 3, className }: { name: IconName; scale?: number; className?: string }) {
  return <PixelSprite sprite={ICONS[name]} scale={scale} className={className} />
}
