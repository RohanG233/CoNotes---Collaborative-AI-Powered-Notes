import type { PresenceUser } from '@/types'
import styles from './PresenceBar.module.css'

interface Props {
  users: PresenceUser[]
  connected: boolean
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#6c63ff', '#52c97a', '#e0a852', '#e05252', '#52b8e0', '#c952e0']

export function PresenceBar({ users, connected }: Props) {
  return (
    <div className={styles.bar} aria-label="Active collaborators">
      <span className={`${styles.dot} ${connected ? styles.online : styles.offline}`} aria-hidden />
      <span className={styles.label}>{connected ? 'Live' : 'Offline'}</span>
      <div className={styles.avatars}>
        {users.map((u, i) => (
          <div
            key={u.id}
            className={styles.avatar}
            style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
            title={u.name}
            aria-label={u.name}
          >
            {initials(u.name)}
          </div>
        ))}
      </div>
    </div>
  )
}
