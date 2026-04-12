import PropTypes from 'prop-types';
import { Modal } from '../ui/Modal';

/**
 * Keyboard shortcut reference modal opened globally via the ? key.
 * @param {{isOpen: boolean, onClose: () => void}} props Shortcut modal props.
 * @returns {JSX.Element} Shortcut modal.
 */
export function ShortcutOverlay({ isOpen, onClose }) {
  const shortcuts = [
    ['Ctrl+K', 'Open command palette'],
    ['?', 'Open shortcuts'],
    ['F', 'Toggle editor focus mode'],
    ['Ctrl+Enter', 'Run code in editor'],
    ['Ctrl+Shift+Enter', 'Submit code'],
    ['Esc', 'Close overlays'],
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      description="Move faster without leaving flow state."
    >
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {shortcuts.map(([combo, meaning]) => (
          <article
            key={combo}
            className="surface-elevated"
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: 'var(--space-3)',
              padding: 'var(--space-3)',
            }}
          >
            <span className="command-kbd" style={{ textAlign: 'center' }}>
              {combo}
            </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>{meaning}</span>
          </article>
        ))}
      </div>
    </Modal>
  );
}

ShortcutOverlay.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
