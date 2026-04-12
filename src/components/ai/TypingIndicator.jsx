import { motion } from 'framer-motion';

/**
 * Animated typing indicator shown while AI responses stream.
 * @returns {JSX.Element} Typing indicator row.
 */
export function TypingIndicator() {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        color: 'var(--color-text-secondary)',
      }}
    >
      <span>Thinking</span>
      <motion.span
        className="cursor-blink"
        aria-hidden="true"
        style={{ color: 'var(--color-accent-primary)', fontFamily: 'var(--font-mono)' }}
      >
        |
      </motion.span>
    </div>
  );
}
