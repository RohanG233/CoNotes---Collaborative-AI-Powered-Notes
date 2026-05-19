import { useState } from 'react'
import { useAI } from '@/hooks/useAI'
import { Button } from './Button'
import type { AIAction } from '@/types'
import styles from './AIPanel.module.css'

interface Props {
  title: string
  content: string
}

const ACTIONS: { key: AIAction; label: string; needsAnswer: boolean }[] = [
  { key: 'summarize', label: '📋 Summarize', needsAnswer: false },
  { key: 'questions', label: '❓ Questions', needsAnswer: false },
  { key: 'explain',   label: '💡 Explain',   needsAnswer: false },
  { key: 'feedback',  label: '🎯 Feedback',  needsAnswer: true  },
]

export function AIPanel({ title, content }: Props) {
  const { result, isLoading, error, run, clear } = useAI()
  const [activeAction, setActiveAction] = useState<AIAction | null>(null)
  const [answer, setAnswer] = useState('')

  const handleRun = async (action: AIAction, needsAnswer: boolean) => {
    if (needsAnswer && !answer.trim()) return
    setActiveAction(action)
    await run(action, title, content, needsAnswer ? answer : undefined)
  }

  return (
    <aside className={styles.panel} aria-label="AI assistant">
      <div className={styles.header}>
        <span className={styles.title}>AI Assistant</span>
        {result && (
          <button className={styles.clear} onClick={clear} aria-label="Clear result">✕</button>
        )}
      </div>

      <div className={styles.actions}>
        {ACTIONS.map(({ key, label, needsAnswer }) => (
          <Button
            key={key}
            variant={activeAction === key && result ? 'primary' : 'ghost'}
            size="sm"
            isLoading={isLoading && activeAction === key}
            disabled={isLoading || !content.trim()}
            onClick={() => handleRun(key, needsAnswer)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className={styles.feedbackInput}>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Your answer (required for Feedback)…"
          rows={3}
          aria-label="Your answer for feedback"
        />
      </div>

      {error && (
        <div className={styles.error} role="alert">{error}</div>
      )}

      {result && (
        <div className={styles.result}>
          <pre className={styles.resultText}>{result}</pre>
        </div>
      )}

      {!result && !error && !isLoading && (
        <p className={styles.hint}>Select an action to analyse this note with AI.</p>
      )}
    </aside>
  )
}
