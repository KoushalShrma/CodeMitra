import { Timer } from 'lucide-react';
import { useSessionTimer } from '../../hooks/useSessionTimer';

/**
 * Displays elapsed app session time for motivational tracking.
 * @returns {JSX.Element} Session timer chip.
 */
export function SessionTimer() {
  const { formatted } = useSessionTimer();

  return (
    <div
      className="surface-elevated"
      aria-label="Session timer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-3)',
      }}
    >
      <Timer size={14} color="var(--color-accent-primary)" />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {formatted}
      </span>
    </div>
  );
}
