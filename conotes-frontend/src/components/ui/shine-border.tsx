import * as React from 'react'
import { cn } from '@/lib/utils'

interface ShineBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the border in pixels.
   * @default 1
   */
  borderWidth?: number
  /**
   * Duration of one full animation cycle in seconds.
   * @default 14
   */
  duration?: number
  /**
   * Single colour or array of colours that form the travelling shine.
   * @default ["#A07CFE","#FE8FB5","#FFBE7B"]
   */
  shineColor?: string | string[]
}

/**
 * ShineBorder — animated travelling-light border effect.
 *
 * Render this as the first child of a `position: relative; overflow: hidden`
 * container.  It is `position: absolute; inset: 0` and `pointer-events: none`
 * so it never interferes with the content inside the container.
 */
export function ShineBorder({
  borderWidth = 1,
  duration = 14,
  shineColor = ['#A07CFE', '#FE8FB5', '#FFBE7B'],
  className,
  style,
  ...props
}: ShineBorderProps) {
  const colors = Array.isArray(shineColor) ? shineColor.join(',') : shineColor

  return (
    <div
      aria-hidden
      style={
        {
          '--shine-border-width': `${borderWidth}px`,
          '--shine-duration': `${duration}s`,
          backgroundImage: `radial-gradient(transparent, transparent, ${colors}, transparent, transparent)`,
          backgroundSize: '300% 300%',
          padding: 'var(--shine-border-width)',
          // mask punches out the content area so only the border strip is visible
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          ...style,
        } as React.CSSProperties
      }
      className={cn('shine-border-anim', className)}
      {...props}
    />
  )
}
