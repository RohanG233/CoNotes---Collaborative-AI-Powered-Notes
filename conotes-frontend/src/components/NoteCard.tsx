import type { NoteListItem } from '@/types'
import styles from './NoteCard.module.css'

interface Props {
  note: NoteListItem
  onOpen: (id: string) => void
  onStar: (id: string) => void
  onDelete: (id: string) => void
}

export function NoteCard({ note, onOpen, onStar, onDelete }: Props) {
  const updated = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const isOwner = note.accessRole === 'owner'

  return (
    <article
      className={styles.card}
      onClick={() => onOpen(note._id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(note._id)}
      aria-label={`Open note: ${note.title}`}
    >
      <div className={styles.header}>
        <div className={styles.titleWrap}>
          <h3 className={styles.title}>{note.title}</h3>
          {!isOwner && <span className={styles.badge}>Collaborator</span>}
        </div>

        {isOwner && (
          <button
            className={`${styles.star} ${note.starred ? styles.starred : ''}`}
            onClick={(e) => { e.stopPropagation(); onStar(note._id) }}
            aria-label={note.starred ? 'Unstar note' : 'Star note'}
            aria-pressed={note.starred}
          >
            *
          </button>
        )}
      </div>

      {note.tags.length > 0 && (
        <div className={styles.tags} aria-label="Tags">
          {note.tags.map((tag) => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <time className={styles.date} dateTime={note.updatedAt}>{updated}</time>
        {isOwner && (
          <button
            className={styles.delete}
            onClick={(e) => { e.stopPropagation(); onDelete(note._id) }}
            aria-label="Delete note"
          >
            x
          </button>
        )}
      </div>
    </article>
  )
}
