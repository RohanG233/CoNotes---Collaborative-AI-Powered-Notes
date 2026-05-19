import { useAuth } from '@/context/AuthContext'
import styles from './Sidebar.module.css'

interface Props {
  filter: 'all' | 'starred'
  onFilterChange: (f: 'all' | 'starred') => void
  onNewNote: () => void
  isCreating: boolean
}

export function Sidebar({ filter, onFilterChange, onNewNote, isCreating }: Props) {
  const { user, logout } = useAuth()

  return (
    <nav className={styles.sidebar} aria-label="Main navigation">
      <div className={styles.brand}>
        <span className={styles.logo} aria-hidden>⚡</span>
        <span className={styles.name}>PrepFlow</span>
      </div>

      <button
        className={styles.newNote}
        onClick={onNewNote}
        disabled={isCreating}
        aria-label="Create new note"
      >
        <span aria-hidden>+</span> New Note
      </button>

      <ul className={styles.nav} role="list">
        <li>
          <button
            className={`${styles.navItem} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => onFilterChange('all')}
            aria-current={filter === 'all' ? 'page' : undefined}
          >
            <span aria-hidden>📝</span> All Notes
          </button>
        </li>
        <li>
          <button
            className={`${styles.navItem} ${filter === 'starred' ? styles.active : ''}`}
            onClick={() => onFilterChange('starred')}
            aria-current={filter === 'starred' ? 'page' : undefined}
          >
            <span aria-hidden>★</span> Starred
          </button>
        </li>
      </ul>

      <div className={styles.user}>
        <div className={styles.avatar} aria-hidden>
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.name}</span>
          <span className={styles.userEmail}>{user?.email}</span>
        </div>
        <button className={styles.logout} onClick={logout} aria-label="Log out" title="Log out">
          ↩
        </button>
      </div>
    </nav>
  )
}
