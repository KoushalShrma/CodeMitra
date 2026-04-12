import PropTypes from 'prop-types';
import { cn } from '../../utils/ui/cn';

/**
 * Renders one AI chat message with lightweight code block formatting.
 * @param {{role: "user" | "assistant", content: string}} props Message props.
 * @returns {JSX.Element} Chat bubble.
 */
export function MessageBubble({ role, content }) {
  const isUser = role === 'user';

  const segments = String(content || '').split(/```/g);

  return (
    <article
      className={cn('surface-elevated')}
      style={{
        padding: 'var(--space-3)',
        justifySelf: isUser ? 'end' : 'start',
        maxWidth: '94%',
        width: 'fit-content',
        borderColor: isUser
          ? 'color-mix(in srgb, var(--color-accent-primary) 35%, transparent)'
          : 'var(--color-border)',
        background: isUser
          ? 'color-mix(in srgb, var(--color-accent-primary) 12%, transparent)'
          : 'var(--color-bg-elevated)',
      }}
    >
      <p className="label-text" style={{ marginBottom: 'var(--space-2)' }}>
        {isUser ? 'You' : 'Groq Mentor'}
      </p>
      <div
        style={{
          display: 'grid',
          gap: 'var(--space-2)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-primary)',
        }}
      >
        {segments.map((segment, index) =>
          index % 2 === 1 ? (
            <pre
              key={`${role}-code-${index}`}
              className="mono-panel"
              style={{
                margin: 0,
                padding: 'var(--space-3)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                color: 'var(--color-syntax-keyword)',
              }}
            >
              <code>{segment.trim()}</code>
            </pre>
          ) : (
            <p key={`${role}-text-${index}`} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {segment.trim()}
            </p>
          )
        )}
      </div>
    </article>
  );
}

MessageBubble.propTypes = {
  role: PropTypes.oneOf(['user', 'assistant']).isRequired,
  content: PropTypes.string.isRequired,
};
