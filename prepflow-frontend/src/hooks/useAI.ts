import { useState, useCallback } from 'react'
import { runAI } from '@/api/ai'
import type { AIAction } from '@/types'

export function useAI() {
  const [result, setResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (
    action: AIAction,
    title: string,
    content: string,
    answer?: string
  ) => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await runAI({ action, title, content, answer })
      setResult(data.result)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'AI request failed'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => { setResult(null); setError(null) }, [])

  return { result, isLoading, error, run, clear }
}
