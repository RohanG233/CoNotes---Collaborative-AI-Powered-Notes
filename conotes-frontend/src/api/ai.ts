import api from './axios'
import type { AIRequest } from '@/types'

export const runAI = (body: AIRequest) =>
  api.post<{ result: string }>('/api/ai', body)
