import React, { type ComponentPropsWithoutRef, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<'button'> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = '#ffffff',
      shimmerSize = '0.05em',
      shimmerDuration = '3s',
      borderRadius = '100px',
      background = 'rgba(0,0,0,1)',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        style={{
          '--shimmer-color': shimmerColor,
          '--shimmer-radius': borderRadius,
          '--shimmer-speed': shimmerDuration,
          '--shimmer-cut': shimmerSize,
          '--shimmer-bg': background,
        } as CSSProperties}
        className={cn('shimmer-btn', className)}
        {...props}
      >
        {/* travelling spark layer */}
        <span className="shimmer-btn-spark" aria-hidden>
          <span className="shimmer-btn-spin" />
        </span>

        {/* content */}
        <span className="shimmer-btn-content">{children}</span>

        {/* inner highlight */}
        <span className="shimmer-btn-highlight" aria-hidden />

        {/* solid background fill (sits behind spark) */}
        <span className="shimmer-btn-bg" aria-hidden />
      </button>
    )
  }
)

ShimmerButton.displayName = 'ShimmerButton'
