import { useState, type KeyboardEvent } from 'react'
import styles from './TagInput.module.css'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  max?: number
}

export function TagInput({ tags, onChange, max = 10 }: Props) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim().toLowerCase()
    if (!val || tags.includes(val) || tags.length >= max) return
    onChange([...tags, val])
    setInput('')
  }

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag))

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1])
  }

  return (
    <div className={styles.wrapper} role="group" aria-label="Tags">
      {tags.map((tag) => (
        <span key={tag} className={styles.tag}>
          {tag}
          <button onClick={() => remove(tag)} aria-label={`Remove tag ${tag}`}>✕</button>
        </span>
      ))}
      {tags.length < max && (
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={tags.length === 0 ? 'Add tags…' : ''}
          aria-label="Add tag"
        />
      )}
    </div>
  )
}
