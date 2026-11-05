import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '@/api/auth'
import { useTheme } from '@/context/ThemeContext'
import { DiaTextReveal } from '@/components/ui/magic-ui/dia-text-reveal'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { ShineBorder } from '@/components/ui/shine-border'
import { RippleButton } from '@/components/ui/ripple-button'
import styles from './AuthPage.module.css'

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

export function SignupPage() {
  const { theme } = useTheme()
  const isLight = theme === 'light'
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      await signup(name, email, password)
      navigate('/login')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Signup failed'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={styles.page}>
      <AnimatedThemeToggler variant="circle" duration={500} className={styles.themeToggle} />

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
        <h1 className={styles.heading}>Create account</h1>
        <p className={styles.sub}>Start your interview prep journey</p>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
              aria-required="true"
            />
          </div>

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
              autoComplete="new-password"
              minLength={6}
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
            Create account
          </RippleButton>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
