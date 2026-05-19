import { useEffect, useState, useCallback, useRef, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { addCollaborator, getNote, updateNote } from '@/api/notes'
import { useSocket } from '@/hooks/useSocket'
import { useDebounce } from '@/hooks/useDebounce'
import { AIPanel } from '@/components/AIPanel'
import { PresenceBar } from '@/components/PresenceBar'
import { TagInput } from '@/components/TagInput'
import { Button } from '@/components/Button'
import type { Note, NoteUpdatePayload, UserTypingPayload } from '@/types'
import styles from './EditorPage.module.css'

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving'>('saved')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(false)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [collaboratorEmail, setCollaboratorEmail] = useState('')
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)

  const isRemoteUpdate = useRef(false)
  const isInitialized = useRef(false)

  const debouncedTitle = useDebounce(title, 800)
  const debouncedContent = useDebounce(content, 800)
  const debouncedTags = useDebounce(tags, 800)

  const handleRemoteUpdate = useCallback((payload: NoteUpdatePayload) => {
    isRemoteUpdate.current = true
    setContent(payload.content)
  }, [])

  const handleTyping = useCallback((payload: UserTypingPayload) => {
    setTypingUsers((prev) =>
      payload.isTyping
        ? prev.includes(payload.name) ? prev : [...prev, payload.name]
        : prev.filter((n) => n !== payload.name)
    )
  }, [])

  const { presence, connected, emitUpdate, emitTyping } = useSocket({
    noteId: id ?? null,
    onRemoteUpdate: handleRemoteUpdate,
    onTyping: handleTyping,
  })

  useEffect(() => {
    if (!id) return
    const load = async () => {
      try {
        const { data } = await getNote(id)
        setNote(data)
        setTitle(data.title)
        setContent(data.content)
        setTags(data.tags)
        setTimeout(() => { isInitialized.current = true }, 900)
      } catch {
        setError('Note not found or access denied.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!note || isLoading || !isInitialized.current) return
    if (
      debouncedTitle === note.title &&
      debouncedContent === note.content &&
      JSON.stringify(debouncedTags) === JSON.stringify(note.tags)
    ) return

    const save = async () => {
      setSaveStatus('saving')
      try {
        const { data } = await updateNote(note._id, {
          title: debouncedTitle,
          content: debouncedContent,
          tags: debouncedTags,
        })
        setNote(data)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }
    save()
  }, [debouncedTitle, debouncedContent, debouncedTags])

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleContentChange = (val: string) => {
    if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return }
    setContent(val)
    setSaveStatus('unsaved')
    emitUpdate(val)
    emitTyping(true)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => emitTyping(false), 2000)
  }

  const handleAddCollaborator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!id || !collaboratorEmail.trim()) return

    setIsSharing(true)
    setShareStatus(null)
    setShareError(null)
    try {
      const { data } = await addCollaborator(id, collaboratorEmail)
      setCollaboratorEmail('')
      setShareStatus(`${data.collaborator.name} can now access this note.`)
      setNote((prev) => prev
        ? { ...prev, collaborators: Array.from(new Set([...prev.collaborators, data.collaborator.id])) }
        : prev
      )
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setShareError(msg ?? 'Failed to add collaborator')
    } finally {
      setIsSharing(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} aria-label="Loading note" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorMsg} role="alert">{error}</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>Back</Button>
      </div>
    )
  }

  const isOwner = note?.accessRole === 'owner'

  return (
    <div className={styles.layout}>
      <div className={styles.editorPane}>
        <header className={styles.header}>
          <button className={styles.back} onClick={() => navigate('/dashboard')} aria-label="Back to dashboard">
            Back
          </button>

          <div className={styles.headerRight}>
            <PresenceBar users={presence} connected={connected} />

            <span className={`${styles.saveStatus} ${styles[saveStatus]}`} aria-live="polite">
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
            </span>

            <button
              className={`${styles.aiToggle} ${showAI ? styles.aiActive : ''}`}
              onClick={() => setShowAI((v) => !v)}
              aria-pressed={showAI}
              aria-label="Toggle AI panel"
            >
              AI
            </button>
          </div>
        </header>

        <div className={styles.editor}>
          <input
            className={styles.titleInput}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setSaveStatus('unsaved') }}
            placeholder="Note title..."
            aria-label="Note title"
          />

          <TagInput tags={tags} onChange={(t) => { setTags(t); setSaveStatus('unsaved') }} />

          {isOwner && (
            <form className={styles.shareForm} onSubmit={handleAddCollaborator}>
              <label className={styles.shareLabel} htmlFor="collaborator-email">
                Add collaborator
              </label>
              <div className={styles.shareControls}>
                <input
                  id="collaborator-email"
                  className={styles.shareInput}
                  type="email"
                  value={collaboratorEmail}
                  onChange={(e) => {
                    setCollaboratorEmail(e.target.value)
                    setShareStatus(null)
                    setShareError(null)
                  }}
                  placeholder="user@example.com"
                  aria-label="Collaborator email"
                />
                <Button type="submit" isLoading={isSharing} disabled={!collaboratorEmail.trim()}>
                  Add
                </Button>
              </div>
              {shareStatus && <p className={styles.shareStatus}>{shareStatus}</p>}
              {shareError && <p className={styles.shareError} role="alert">{shareError}</p>}
            </form>
          )}

          {!isOwner && (
            <p className={styles.collaboratorNotice}>You are editing this note as a collaborator.</p>
          )}

          <textarea
            className={styles.contentArea}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing in Markdown..."
            aria-label="Note content"
            spellCheck
          />

          {typingUsers.length > 0 && (
            <p className={styles.typing} aria-live="polite">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </p>
          )}
        </div>
      </div>

      {showAI && (
        <div className={styles.aiPane}>
          <AIPanel title={title} content={content} />
        </div>
      )}
    </div>
  )
}
