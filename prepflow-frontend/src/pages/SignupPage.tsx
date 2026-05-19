import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '@/api/auth'
import { Button } from '@/components/Button'
import styles from './AuthPage.module.css'

export function SignupPage() {
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
      <div className={styles.card}>
        <div className={styles.brand}>
          <span aria-hidden>⚡</span> PrepFlow
        </div>
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

          <Button type="submit" isLoading={isLoading} className={styles.submit}>
            Create account
          </Button>
        </form>

        <p className={styles.switch}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  )
}
