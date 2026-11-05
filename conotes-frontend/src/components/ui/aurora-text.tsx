import React, { memo } from 'react'

interface AuroraTextProps {
  children: React.ReactNode
  className?: string
  /** Gradient colours cycled across the text. */
  colors?: string[]
  /** Animation speed multiplier. Default 1. */
  speed?: number
}

export const AuroraText = memo(
  ({
    children,
    className = '',
    colors = ['#FF0080', '#7928CA', '#0070F3', '#38bdf8'],
    speed = 1,
  }: AuroraTextProps) => {
    const gradientStyle: React.CSSProperties = {
      backgroundImage: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})`,
      backgroundSize: '200% auto',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent',
      animationDuration: `${10 / speed}s`,
    }

    return (
      <span className={`aurora-text-wrap ${className}`}>
        <span className="sr-only">{children}</span>
        <span
          className="aurora-text-anim"
          style={gradientStyle}
          aria-hidden="true"
        >
          {children}
        </span>
      </span>
    )
  }
)

AuroraText.displayName = 'AuroraText'
