// DiaTextReveal — lightweight animated text reveal using CSS custom properties.
// The MagicUI registry version depends on a separate registry bundle; this is a
// self-contained equivalent that matches the same visual behaviour.
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface DiaTextRevealProps {
  text: string
  className?: string
  /** Highlight colours cycled across each character. */
  colors?: string[]
  /** Delay before the animation starts (ms). Default: 200 */
  delay?: number
}

export function DiaTextReveal({
  text,
  className,
  colors = ['#22d3ee', '#818cf8', '#f472b6', '#34d399'],
  delay = 200,
}: DiaTextRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setRevealed(true) },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <span
      ref={ref}
      className={cn('inline-block', className)}
      aria-label={text}
    >
      {text.split('').map((char, i) => {
        const color = colors[i % colors.length]
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: 'inline-block',
              color: revealed ? color : 'inherit',
              transform: revealed ? 'translateY(0)' : 'translateY(0.25em)',
              opacity: revealed ? 1 : 0,
              transition: `color 400ms ease, opacity 400ms ease, transform 400ms ease`,
              transitionDelay: `${delay + i * 30}ms`,
              whiteSpace: char === ' ' ? 'pre' : undefined,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        )
      })}
    </span>
  )
}
