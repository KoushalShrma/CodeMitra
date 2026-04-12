import PropTypes from 'prop-types';

/**
 * Test case comparison table showing expected and actual outputs per case.
 * @param {{results: Array<{id: string, label?: string, input: string, expectedOutput: string, actualOutput: string, status: string}>}} props Test case props.
 * @returns {JSX.Element} Test case panel.
 */
export function TestCasePanel({ results }) {
  return (
    <section
      className="surface-elevated"
      style={{
        padding: 'var(--space-3)',
        display: 'grid',
        gap: 'var(--space-3)',
        overflow: 'auto',
      }}
    >
      <header>
        <h3 style={{ fontSize: 'var(--text-lg)' }}>Test Cases</h3>
      </header>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {results.length ? (
          results.map((item) => (
            <article
              key={item.id}
              className="surface-card"
              style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                  alignItems: 'center',
                }}
              >
                <strong style={{ fontSize: 'var(--text-sm)' }}>{item.label || item.id}</strong>
                <span
                  className="ui-badge"
                  style={{
                    color: item.status === 'Pass' ? 'var(--color-success)' : 'var(--color-danger)',
                    borderColor:
                      item.status === 'Pass' ? 'var(--color-success)' : 'var(--color-danger)',
                  }}
                >
                  {item.status}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                Input: {item.input}
              </p>
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                Expected: {item.expectedOutput}
              </p>
              <p
                style={{
                  margin: 0,
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-xs)',
                }}
              >
                Actual: {item.actualOutput}
              </p>
            </article>
          ))
        ) : (
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            Run your code to compare outputs.
          </p>
        )}
      </div>
    </section>
  );
}

TestCasePanel.propTypes = {
  results: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string,
      input: PropTypes.string.isRequired,
      expectedOutput: PropTypes.string.isRequired,
      actualOutput: PropTypes.string,
      status: PropTypes.string,
    })
  ).isRequired,
};
