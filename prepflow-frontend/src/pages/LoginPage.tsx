import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/Button'
import styles from './AuthPage.module.css'

export function LoginPage() {
  const { login: setAuth } = useAuth()
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
      <div className={styles.card}>
        <div className={styles.brand}>
          <span aria-hidden>⚡</span> PrepFlow
        </div>
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

          <Button type="submit" isLoading={isLoading} className={styles.submit}>
            Sign in
          </Button>
        </form>

        <p className={styles.switch}>
          No account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </main>
  )
}
