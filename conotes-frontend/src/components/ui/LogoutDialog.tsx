import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { ShineBorder } from '@/components/ui/shine-border'
import { RippleButton } from '@/components/ui/ripple-button'

interface Props {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function LogoutDialog({ open, onConfirm, onCancel }: Props) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="logout-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            aria-hidden
          />

          {/* Dialog */}
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-desc"
            className="logout-dialog"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            <ShineBorder
              shineColor={['#e05252', '#f97316', '#6c63ff']}
              duration={5}
              borderWidth={1.5}
            />

            <div className="logout-dialog-inner">
              <span className="logout-dialog-emoji" aria-hidden>👋</span>
              <h2 id="logout-title" className="logout-dialog-title">
                Log out? Just like that??
              </h2>
              <p id="logout-desc" className="logout-dialog-desc">
                Your notes are saved. You can always come back.
              </p>

              <div className="logout-dialog-actions">
                <RippleButton
                  onClick={onConfirm}
                  rippleColor="rgba(255,255,255,0.4)"
                  className="logout-dialog-yes"
                  autoFocus
                >
                  Yes, log me out
                </RippleButton>

                <RippleButton
                  onClick={onCancel}
                  rippleColor="rgba(108,99,255,0.3)"
                  className="logout-dialog-no"
                >
                  No, stay
                </RippleButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
