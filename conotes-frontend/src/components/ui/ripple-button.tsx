import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react'
import { cn } from '@/lib/utils'

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string
  duration?: string
  isLoading?: boolean
}

type RippleItem = { x: number; y: number; size: number; key: number }

function ButtonRipple({
  ripple,
  duration,
  rippleColor,
  onDone,
}: {
  ripple: RippleItem
  duration: string
  rippleColor: string
  onDone: (key: number) => void
}) {
  useEffect(() => {
    const ms = parseInt(duration, 10)
    const t = setTimeout(() => onDone(ripple.key), ms)
    return () => clearTimeout(t)
  }, [duration, onDone, ripple.key])

  return (
    <span
      aria-hidden
      className="ripple-circle"
      style={
        {
          width: `${ripple.size}px`,
          height: `${ripple.size}px`,
          top: `${ripple.y}px`,
          left: `${ripple.x}px`,
          backgroundColor: rippleColor,
          '--ripple-duration': duration,
        } as React.CSSProperties
      }
    />
  )
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      className,
      children,
      rippleColor = '#ffffff',
      duration = '600ms',
      isLoading,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<RippleItem[]>([])
    const nextKey = useRef(0)

    const removeRipple = useCallback((key: number) => {
      setRipples((prev) => prev.filter((r) => r.key !== key))
    }, [])

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget
      const rect = btn.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = e.clientX - rect.left - size / 2
      const y = e.clientY - rect.top - size / 2
      nextKey.current += 1
      setRipples((prev) => [...prev, { x, y, size, key: nextKey.current }])
      onClick?.(e)
    }

    return (
      <button
        ref={ref}
        className={cn('ripple-btn', className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? <span className="ripple-btn-spinner" aria-hidden /> : null}
        <span className="ripple-btn-label">{children}</span>
        <span className="ripple-btn-overlay" aria-hidden>
          {ripples.map((r) => (
            <ButtonRipple
              key={r.key}
              ripple={r}
              duration={duration}
              rippleColor={rippleColor}
              onDone={removeRipple}
            />
          ))}
        </span>
      </button>
    )
  }
)

RippleButton.displayName = 'RippleButton'
