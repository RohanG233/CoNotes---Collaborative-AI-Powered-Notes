import { useNavigate } from 'react-router-dom'
import Shuffle from '@/components/ui/gsap/ScrollTrigger'
import { RippleButton } from '@/components/ui/ripple-button'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { RetroGrid } from '@/components/ui/retro-grid'
import { DiaTextReveal } from '@/components/ui/magic-ui/dia-text-reveal'
import styles from './HomePage.module.css'

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI That Actually Helps',
    body: 'Summarise notes in seconds, generate tiered interview questions, get plain-English explanations, and receive structured feedback on your own answers — all without leaving the editor.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Collaboration',
    body: 'Invite a teammate by email and edit the same note together live. See who is typing, watch cursors move, and never lose a change — powered by Socket.IO.',
  },
  {
    icon: '📝',
    title: 'Notes Built for Prep',
    body: 'Write in Markdown, tag by topic, star the ones that matter, and search across everything instantly. Your notes stay organised so your brain can focus on the material.',
  },
  {
    icon: '🔒',
    title: 'Secure by Default',
    body: 'HttpOnly cookies, short-lived access tokens, refresh-token rotation, and bcrypt-hashed passwords. Your session and your notes are yours alone.',
  },
]

export function HomePage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      {/* ── Retro grid background ── */}
      <RetroGrid
        angle={65}
        cellSize={60}
        opacity={0.55}
        lightLineColor="rgba(91,81,245,0.7)"
        darkLineColor="rgba(108,99,255,0.45)"
      />

      {/* ── Navbar ── */}
      <nav className={styles.nav}>
        <span className={styles.navBrand}>CoNotes</span>
        <div className={styles.navActions}>
          <AnimatedThemeToggler
            variant="circle"
            duration={500}
            className={styles.themeToggle}
          />
          <ShimmerButton
            shimmerColor="rgba(108,99,255,0.9)"
            background="rgba(15,15,15,0.9)"
            borderRadius="var(--radius-full)"
            shimmerDuration="2.5s"
            className={styles.navLogin}
            onClick={() => navigate('/login')}
          >
            Log in
          </ShimmerButton>
          <RainbowButton
            className={styles.navRegister}
            onClick={() => navigate('/signup')}
          >
            Get started free
          </RainbowButton>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        {/* Badge */}
        <div className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden />
          Interview prep, reimagined
        </div>

        {/* Big title via ScrollTrigger Shuffle */}
        <h1 className={styles.heroTitle} aria-label="CoNotes">
          <Shuffle
            text="CoNotes"
            effect="slide"
            shuffleDirection="right"
            duration={0.5}
            animationMode="evenodd"
            shuffleTimes={2}
            ease="power3.out"
            stagger={0.05}
            threshold={0.01}
            triggerOnce={false}
            triggerOnHover={true}
            motionBlur={false}
            respectReducedMotion={true}
            accentColor="#f97316"
            tag="span"
            className={styles.heroTitleShuffle}
          />
        </h1>

        {/* Sub heading with DiaTextReveal */}
        <p className={styles.heroSub}>
          <DiaTextReveal
            text="Notes that think with you."
            colors={['#6c63ff', '#a78bfa', '#818cf8', '#6c63ff', '#c4b5fd', '#a78bfa', '#6c63ff',
                     '#818cf8', '#a78bfa', '#6c63ff', '#c4b5fd', '#818cf8', '#6c63ff', '#a78bfa',
                     '#818cf8', '#6c63ff', '#c4b5fd', '#a78bfa', '#818cf8', '#6c63ff', '#a78bfa']}
            delay={400}
            className={styles.heroSubReveal}
          />
        </p>

        <p className={styles.heroDesc}>
          Write faster, study smarter, and ace your interviews with AI-powered notes
          and real-time collaboration — all in one place.
        </p>

        {/* CTAs */}
        <div className={styles.heroCtas}>
          <RainbowButton
            className={styles.ctaPrimary}
            onClick={() => navigate('/signup')}
          >
            Start for free →
          </RainbowButton>
          <RippleButton
            rippleColor="rgba(108,99,255,0.3)"
            className={styles.ctaSecondary}
            onClick={() => navigate('/login')}
          >
            I already have an account
          </RippleButton>
        </div>

        {/* Social proof */}
        <p className={styles.socialProof}>
          No credit card required · Works in your browser · Free forever
        </p>
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <h2 className={styles.featuresHeading}>Everything you need to prep, nothing you don't</h2>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon} aria-hidden>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureBody}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className={styles.bottomCta}>
        <h2 className={styles.bottomCtaHeading}>
          Your next offer starts with better notes.
        </h2>
        <p className={styles.bottomCtaDesc}>
          Join candidates who prep smarter, not harder.
        </p>
        <RainbowButton
          className={styles.bottomCtaBtn}
          onClick={() => navigate('/signup')}
        >
          Create your free account
        </RainbowButton>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span>© 2026 CoNotes</span>
        <span className={styles.footerDot} aria-hidden>·</span>
        <span>Built for interview warriors</span>
      </footer>
    </div>
  )
}
