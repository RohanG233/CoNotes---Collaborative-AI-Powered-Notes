import api from './axios'
import { clearAuthTokens, getRefreshToken, setAuthTokens } from './axios'
import type { User } from '@/types'

interface AuthResponse {
  user: User
  accessToken?: string
  refreshToken?: string
}

interface RefreshResponse {
  ok: boolean
  accessToken?: string
  refreshToken?: string
}

export const signup = (name: string, email: string, password: string) =>
  api.post<{ message: string }>('/api/auth/signup', { name, email, password })

export const login = async (email: string, password: string) => {
  const res = await api.post<AuthResponse>('/api/auth/login', { email, password })
  setAuthTokens(res.data)
  return res
}

export const refresh = async () => {
  const res = await api.post<RefreshResponse>('/api/auth/refresh', { refreshToken: getRefreshToken() })
  setAuthTokens(res.data)
  return res
}

export const logout = async () => {
  try {
    return await api.post('/api/auth/logout', { refreshToken: getRefreshToken() })
  } finally {
    clearAuthTokens()
  }
}

export const getMe = () =>
  api.get<User>('/api/auth/me')
