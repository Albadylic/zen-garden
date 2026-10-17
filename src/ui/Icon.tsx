// Interface icons from the Level 1 asset pack (public/assets/icons). They are
// decorative: the button or label beside each one carries its accessible name.

import type { IconName } from './icons'

interface Props {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 28, className }: Props) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}assets/icons/icon_${name}.svg`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className ? `icon ${className}` : 'icon'}
    />
  )
}
