import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Copy } from 'lucide-react';
import { Button } from '../ui/Button';

const TABS = ['Description', 'Examples', 'Constraints', 'Hints'];

/**
 * Left-side problem statement panel with tabbed content and copyable examples.
 * @param {{problem: any}} props Problem panel props.
 * @returns {JSX.Element} Problem statement panel.
 */
export function ProblemStatementPanel({ problem }) {
  const [activeTab, setActiveTab] = useState('Description');

  const hints = useMemo(
    () => [
      `Try identifying a ${problem?.pattern || 'core'} pattern first.`,
      'Write a quick brute-force idea to validate edge cases before optimizing.',
      'Track complexity while coding and look for opportunities to reduce repeated work.',
    ],
    [problem?.pattern]
  );

  return (
    <aside
      className="surface-card"
      style={{
        padding: 'var(--space-5)',
        display: 'grid',
        gap: 'var(--space-4)',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <header style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-2xl)' }}>{problem.title}</h2>
          <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
            <span className="tiny-dot" />
            {problem.difficulty}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          <span className="ui-badge">{problem.topic}</span>
          <span className="ui-badge">{problem.pattern}</span>
        </div>
      </header>

      <nav
        aria-label="Problem content tabs"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}
      >
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </nav>

      {activeTab === 'Description' ? (
        <article style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>{problem.description}</p>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Build the most efficient approach you can while keeping your solution readable.
          </p>
        </article>
      ) : null}

      {activeTab === 'Examples' ? (
        <article style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <div className="mono-panel" style={{ padding: 'var(--space-3)', position: 'relative' }}>
            <Button
              variant="ghost"
              ariaLabel="Copy example input and output"
              onClick={async () => {
                await navigator.clipboard.writeText(
                  `Input: ${problem.example.input}\nOutput: ${problem.example.output}`
                );
              }}
              style={{ position: 'absolute', top: 8, right: 8 }}
            >
              <Copy size={14} />
            </Button>
            <p
              style={{
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Input: {problem.example.input}
            </p>
            <p
              style={{
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
              }}
            >
              Output: {problem.example.output}
            </p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              {problem.example.explanation}
            </p>
          </div>
        </article>
      ) : null}

      {activeTab === 'Constraints' ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: 'var(--space-4)',
            display: 'grid',
            gap: 'var(--space-2)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {problem.constraints.map((constraint) => (
            <li key={constraint}>{constraint}</li>
          ))}
        </ul>
      ) : null}

      {activeTab === 'Hints' ? (
        <ol
          style={{
            margin: 0,
            paddingLeft: 'var(--space-4)',
            display: 'grid',
            gap: 'var(--space-2)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {hints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ol>
      ) : null}
    </aside>
  );
}

ProblemStatementPanel.propTypes = {
  problem: PropTypes.shape({
    title: PropTypes.string.isRequired,
    difficulty: PropTypes.string.isRequired,
    topic: PropTypes.string.isRequired,
    pattern: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    constraints: PropTypes.arrayOf(PropTypes.string).isRequired,
    example: PropTypes.shape({
      input: PropTypes.string.isRequired,
      output: PropTypes.string.isRequired,
      explanation: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};
