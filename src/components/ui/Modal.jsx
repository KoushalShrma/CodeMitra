import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { Button } from './Button';

/**
 * Accessible modal primitive with escape/overlay close behavior.
 * @param {{isOpen: boolean, title: string, description?: string, onClose: () => void, children: import("react").ReactNode, footer?: import("react").ReactNode}} props Modal props.
 * @returns {JSX.Element | null} Modal dialog.
 */
export function Modal({ isOpen, title, description, onClose, children, footer }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="ui-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.section
            className="ui-modal-panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header
              style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}
            >
              <h2 id="modal-title" style={{ fontSize: 'var(--text-2xl)' }}>
                {title}
              </h2>
              {description ? (
                <p
                  style={{
                    marginTop: 'var(--space-2)',
                    color: 'var(--color-text-secondary)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {description}
                </p>
              ) : null}
            </header>
            <div style={{ padding: 'var(--space-5)' }}>{children}</div>
            <footer
              style={{
                padding: 'var(--space-5)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
              }}
            >
              {footer || (
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              )}
            </footer>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
};
