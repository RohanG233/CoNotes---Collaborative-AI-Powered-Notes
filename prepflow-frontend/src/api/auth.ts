import api from './axios'
import type { User } from '@/types'

export const signup = (name: string, email: string, password: string) =>
  api.post<{ user: User }>('/api/auth/signup', { name, email, password })

export const login = (email: string, password: string) =>
  api.post<{ user: User }>('/api/auth/login', { email, password })

export const refresh = () =>
  api.post<{ ok: boolean }>('/api/auth/refresh')

export const logout = () =>
  api.post('/api/auth/logout')

export const getMe = () =>
  api.get<User>('/api/auth/me')
