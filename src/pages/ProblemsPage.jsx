import { ArrowUpDown, Grid2x2, List, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { practiceProblems } from '../data/practiceProblems';

const difficultyWeight = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

/**
 * Problem explorer with filter chips, sorting options, and card/table view modes.
 * @returns {JSX.Element} Problems page.
 */
function ProblemsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [topic, setTopic] = useState('All');
  const [pattern, setPattern] = useState('All');
  const [sortBy, setSortBy] = useState('difficulty');
  const [viewMode, setViewMode] = useState('cards');

  const difficultyOptions = useMemo(
    () => ['All', ...new Set(practiceProblems.map((item) => item.difficulty))],
    []
  );
  const topicOptions = useMemo(
    () => ['All', ...new Set(practiceProblems.map((item) => item.topic))],
    []
  );
  const patternOptions = useMemo(
    () => ['All', ...new Set(practiceProblems.map((item) => item.pattern))],
    []
  );

  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matched = practiceProblems.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.topic.toLowerCase().includes(normalizedQuery) ||
        item.pattern.toLowerCase().includes(normalizedQuery);
      const matchesDifficulty = difficulty === 'All' || item.difficulty === difficulty;
      const matchesTopic = topic === 'All' || item.topic === topic;
      const matchesPattern = pattern === 'All' || item.pattern === pattern;

      return matchesQuery && matchesDifficulty && matchesTopic && matchesPattern;
    });

    const sorted = [...matched].sort((left, right) => {
      if (sortBy === 'difficulty') {
        return difficultyWeight[left.difficulty] - difficultyWeight[right.difficulty];
      }

      if (sortBy === 'topic') {
        return left.topic.localeCompare(right.topic);
      }

      return left.title.localeCompare(right.title);
    });

    return sorted;
  }, [difficulty, pattern, query, sortBy, topic]);

  const hardCount = useMemo(
    () => filteredProblems.filter((item) => item.difficulty === 'Hard').length,
    [filteredProblems]
  );

  return (
    <section
      className="page-main"
      aria-label="Problem explorer"
      style={{ display: 'grid', gap: 'var(--space-5)' }}
    >
      <header
        className="surface-card mesh-hero"
        style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-5)' }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 'var(--space-2)' }}>
          <span className="label-text">Problem Explorer</span>
          <h1 style={{ fontSize: 'var(--text-3xl)' }}>Find the Right Challenge Fast</h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 760 }}>
            Search by topic or pattern, switch between card and table layouts, and jump directly
            into the editor.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 'var(--space-3)' }}>
          <label htmlFor="problem-search" style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <span className="label-text">Search</span>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '16px 1fr',
                alignItems: 'center',
                gap: 'var(--space-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'color-mix(in srgb, var(--color-bg-elevated) 88%, transparent)',
                padding: 'var(--space-3) var(--space-4)',
              }}
            >
              <Search size={14} color="var(--color-text-muted)" />
              <input
                id="problem-search"
                className="ui-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, topic, pattern, or keyword"
                aria-label="Search problems"
                style={{ border: 'none', background: 'transparent', padding: 0 }}
              />
            </div>
          </label>

          <div
            style={{
              display: 'grid',
              gap: 'var(--space-3)',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            <label style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span className="label-text">Difficulty</span>
              <select
                className="ui-select"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                aria-label="Filter by difficulty"
              >
                {difficultyOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span className="label-text">Topic</span>
              <select
                className="ui-select"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                aria-label="Filter by topic"
              >
                {topicOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span className="label-text">Pattern</span>
              <select
                className="ui-select"
                value={pattern}
                onChange={(event) => setPattern(event.target.value)}
                aria-label="Filter by pattern"
              >
                {patternOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <span className="label-text">Sort</span>
              <select
                className="ui-select"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort problems"
              >
                <option value="difficulty">Difficulty</option>
                <option value="topic">Topic</option>
                <option value="title">Title</option>
              </select>
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span className="ui-badge">Visible: {filteredProblems.length}</span>
              <span className="ui-badge">Total: {practiceProblems.length}</span>
              <span
                className="ui-badge"
                style={{ color: 'var(--color-hard)', borderColor: 'var(--color-hard)' }}
              >
                Hard: {hardCount}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('cards')}
              >
                <Grid2x2 size={14} />
                Cards
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode('table')}
              >
                <List size={14} />
                Table
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery('');
                  setDifficulty('All');
                  setTopic('All');
                  setPattern('All');
                  setSortBy('difficulty');
                }}
              >
                <ArrowUpDown size={14} />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      {viewMode === 'cards' ? (
        <section
          aria-label="Problem cards"
          style={{
            display: 'grid',
            gap: 'var(--space-4)',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))',
          }}
        >
          {filteredProblems.map((problem) => (
            <article
              key={problem.id}
              className="surface-card"
              style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  alignItems: 'start',
                }}
              >
                <h2 style={{ fontSize: 'var(--text-lg)' }}>{problem.title}</h2>
                <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
                  <span className="tiny-dot" />
                  {problem.difficulty}
                </span>
              </div>

              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: 1.6,
                }}
              >
                {problem.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <span className="ui-badge">{problem.topic}</span>
                <span className="ui-badge">{problem.pattern}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                  ID: {problem.id}
                </span>
                <Button onClick={() => navigate(`/editor/${problem.id}`)}>Solve</Button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="surface-card" aria-label="Problem table" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 'var(--space-3)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  Title
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 'var(--space-3)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  Difficulty
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 'var(--space-3)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  Topic
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 'var(--space-3)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  Pattern
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: 'var(--space-3)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProblems.map((problem) => (
                <tr key={problem.id}>
                  <td
                    style={{
                      padding: 'var(--space-3)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    {problem.title}
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-3)',
                      borderBottom: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}
                    >
                      <span className="tiny-dot" />
                      {problem.difficulty}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-3)',
                      borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {problem.topic}
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-3)',
                      borderBottom: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {problem.pattern}
                  </td>
                  <td
                    style={{
                      padding: 'var(--space-3)',
                      borderBottom: '1px solid var(--color-border)',
                      textAlign: 'right',
                    }}
                  >
                    <Button variant="secondary" onClick={() => navigate(`/editor/${problem.id}`)}>
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!filteredProblems.length ? (
        <section
          className="surface-elevated"
          style={{ padding: 'var(--space-5)', textAlign: 'center' }}
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No problems match your current filters. Try clearing one or more filters.
          </p>
        </section>
      ) : null}
    </section>
  );
}

export default ProblemsPage;
