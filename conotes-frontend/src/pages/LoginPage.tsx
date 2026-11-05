import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { DiaTextReveal } from '@/components/ui/magic-ui/dia-text-reveal'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { ShineBorder } from '@/components/ui/shine-border'
import { RippleButton } from '@/components/ui/ripple-button'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import styles from './AuthPage.module.css'

// Dark-mode colours: light purples that pop on dark backgrounds
const TITLE_COLORS_DARK  = ['#6c63ff', '#a78bfa', '#818cf8', '#6c63ff', '#c4b5fd', '#818cf8', '#6c63ff']
const TITLE_COLORS_LIGHT = ['#4338ca', '#5b21b6', '#3730a3', '#4338ca', '#6d28d9', '#3730a3', '#4338ca']

const SUB_COLORS_DARK  = ['#8b90b8', '#a78bfa', '#818cf8', '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8',
                           '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8',
                           '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8',
                           '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8',
                           '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8', '#a78bfa', '#818cf8', '#8b90b8']
const SUB_COLORS_LIGHT = ['#374151', '#4338ca', '#374151', '#5b21b6', '#374151', '#4338ca', '#374151',
                           '#374151', '#4338ca', '#374151', '#5b21b6', '#374151', '#4338ca', '#374151',
                           '#374151', '#4338ca', '#374151', '#5b21b6', '#374151', '#4338ca', '#374151',
                           '#374151', '#4338ca', '#374151', '#5b21b6', '#374151', '#4338ca', '#374151',
                           '#374151', '#4338ca', '#374151', '#5b21b6', '#374151', '#4338ca', '#374151']

export function LoginPage() {
  const { login: setAuth } = useAuth()
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const { data } = await login(email, password)
      setAuth(data.user)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Login failed'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <AnimatedThemeToggler variant="circle" duration={500} className={styles.themeToggle} />
      <ShimmerButton
        onClick={() => navigate('/')}
        shimmerColor="rgba(108,99,255,0.9)"
        background="rgba(15,15,15,0.85)"
        borderRadius="var(--radius-full)"
        shimmerDuration="2.5s"
        className={styles.homeBtn}
        aria-label="Back to home"
      >
        ← Home
      </ShimmerButton>

      {/* ── Left: branding ── */}
      <div className={styles.hero}>
        <DiaTextReveal
          text="CoNotes"
          className={styles.heroTitle}
          colors={isLight ? TITLE_COLORS_LIGHT : TITLE_COLORS_DARK}
          delay={100}
        />
        <p className={styles.heroSub}>
          <DiaTextReveal
            text="AI-powered notes for interview prep"
            className={styles.heroSub}
            colors={isLight ? SUB_COLORS_LIGHT : SUB_COLORS_DARK}
            delay={700}
          />
        </p>
      </div>

      {/* ── Right: form card ── */}
      <div className={styles.card}>
        <ShineBorder
          shineColor={['#6c63ff', '#a78bfa', '#c4b5fd']}
          duration={8}
          borderWidth={1.5}
        />
        <h1 className={styles.heading}>Welcome back</h1>
        <p className={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-required="true"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              aria-required="true"
            />
          </div>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <RippleButton
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            rippleColor="rgba(255,255,255,0.5)"
            duration="600ms"
            className={styles.submit}
          >
            Sign in
          </RippleButton>
        </form>

        <p className={styles.switch}>
          No account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </main>
  )
}
