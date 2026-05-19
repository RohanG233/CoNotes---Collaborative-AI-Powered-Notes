import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { getMe, logout as apiLogout, refresh } from '@/api/auth'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const login = useCallback((userData: User) => {
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try { await apiLogout() } catch { /* ignore */ }
    setUser(null)
  }, [])

  useEffect(() => {
    const handleForceLogout = () => logout()
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [logout])

  useEffect(() => {
    const init = async () => {
      try {
        await refresh()
        const { data: me } = await getMe()
        setUser(me)
      } catch {
        // no valid session — stay logged out
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
