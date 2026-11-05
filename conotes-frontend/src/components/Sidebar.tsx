import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import Shuffle from '@/components/ui/gsap/ScrollTrigger'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { LogoutDialog } from '@/components/ui/LogoutDialog'
import styles from './Sidebar.module.css'

interface Props {
  filter: 'all' | 'starred'
  onFilterChange: (f: 'all' | 'starred') => void
  onNewNote: () => void
  isCreating: boolean
}

export function Sidebar({ filter, onFilterChange, onNewNote, isCreating }: Props) {
  const { user, logout } = useAuth()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleLogoutClick = () => setShowLogoutDialog(true)
  const handleConfirm = () => { setShowLogoutDialog(false); logout() }
  const handleCancel = () => setShowLogoutDialog(false)

  return (
    <nav className={styles.sidebar} aria-label="Main navigation">
      <LogoutDialog
        open={showLogoutDialog}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <div className={styles.brand}>
        <span className={styles.name}>
          <Shuffle
            text="CoNotes"
            effect="slide"
            shuffleDirection="right"
            duration={0.4}
            animationMode="evenodd"
            shuffleTimes={2}
            ease="power3.out"
            stagger={0.04}
            threshold={0.01}
            triggerOnce={false}
            triggerOnHover={true}
            hoverRadius={0}
            motionBlur={false}
            respectReducedMotion={true}
            maxDelay={0}
            loop={false}
            loopDelay={0}
            tag="span"
            accentColor="#f97316"
            className={styles.shuffleBrand}
          />
        </span>
      </div>

      <RainbowButton
        onClick={onNewNote}
        disabled={isCreating}
        isLoading={isCreating}
        aria-label="Create new note"
        className={styles.newNote}
      >
        <span aria-hidden>+</span> New Note
      </RainbowButton>

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
        <AnimatedThemeToggler
          variant="circle"
          duration={500}
          className={styles.themeToggle}
          aria-label="Toggle light/dark theme"
        />
        <button className={styles.logout} onClick={handleLogoutClick} aria-label="Log out" title="Log out">
          ↩
        </button>
      </div>
    </nav>
  )
}
