import PropTypes from 'prop-types';

/**
 * Displays execution verdict, runtime metrics, and output/error content.
 * @param {{summary: any}} props Execution summary props.
 * @returns {JSX.Element} Execution result panel.
 */
export function ExecutionResultPanel({ summary }) {
  const statusColor =
    summary.status === 'Accepted'
      ? 'var(--color-success)'
      : summary.status === 'Running'
        ? 'var(--color-warning)'
        : summary.status === 'Idle'
          ? 'var(--color-text-secondary)'
          : 'var(--color-danger)';

  return (
    <section
      className="surface-elevated"
      style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-3)' }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        <span className="ui-badge" style={{ color: statusColor, borderColor: statusColor }}>
          {summary.status}
        </span>
        <div
          style={{
            display: 'inline-flex',
            gap: 'var(--space-3)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <span>Runtime: {summary.runtime}</span>
          <span>Memory: {summary.memory}</span>
          <span>
            Passed: {summary.passed}/{summary.total}
          </span>
        </div>
      </div>

      <pre
        className="mono-panel"
        style={{
          margin: 0,
          padding: 'var(--space-3)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-sm)',
          whiteSpace: 'pre-wrap',
        }}
      >
        <code>{summary.error || summary.output}</code>
      </pre>
    </section>
  );
}

ExecutionResultPanel.propTypes = {
  summary: PropTypes.shape({
    status: PropTypes.string.isRequired,
    runtime: PropTypes.string.isRequired,
    memory: PropTypes.string.isRequired,
    output: PropTypes.string.isRequired,
    error: PropTypes.string.isRequired,
    passed: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
  }).isRequired,
};
