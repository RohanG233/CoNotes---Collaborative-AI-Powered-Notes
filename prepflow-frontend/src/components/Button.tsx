import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  isLoading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', isLoading, children, disabled, className = '', ...rest }: Props) {
  return (
    <button
      className={`${styles.btn} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? <span className={styles.spinner} aria-hidden /> : null}
      {children}
    </button>
  )
}
