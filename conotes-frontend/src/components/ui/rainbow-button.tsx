import React from 'react'
import { cn } from '@/lib/utils'

interface RainbowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
}

export const RainbowButton = React.forwardRef<HTMLButtonElement, RainbowButtonProps>(
  ({ className, children, isLoading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn('rainbow-btn', className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? <span className="rainbow-btn-spinner" aria-hidden /> : null}
        <span className="rainbow-btn-label">{children}</span>
      </button>
    )
  }
)

RainbowButton.displayName = 'RainbowButton'
