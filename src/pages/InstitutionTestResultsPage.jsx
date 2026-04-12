import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { exportInstitutionTestResultsV2, getInstitutionTestResultsV2 } from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';
import { getInstitutionSession } from '../utils/institutionSession';

function InstitutionTestResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { testId } = useParams();
  const query = new URLSearchParams(location.search);
  const institutionId = query.get('institutionId') || String(getInstitutionSession()?.institution?.id || '');

  const [csvExport, setCsvExport] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: payload,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.institutionResults(institutionId, testId),
    queryFn: () => getInstitutionTestResultsV2(institutionId, testId),
    enabled: Boolean(institutionId && testId),
    staleTime: QUERY_STALE_TIMES.institution,
  });

  const exportMutation = useMutation({
    mutationFn: () => exportInstitutionTestResultsV2(institutionId, testId),
    onSuccess: (csv) => {
      setCsvExport(csv);
      setErrorMessage('');
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to export CSV');
    },
  });

  const queryErrorMessage =
    !institutionId || !testId
      ? 'institutionId and testId are required'
      : error instanceof Error
        ? error.message
        : '';

  const rows = useMemo(() => payload?.rows || [], [payload]);
  const stats = useMemo(() => {
    const scores = rows.map((row) => Number(row.score || 0));
    if (!scores.length) {
      return {
        count: 0,
        average: 0,
        highest: 0,
      };
    }

    const total = scores.reduce((sum, value) => sum + value, 0);
    return {
      count: scores.length,
      average: Math.round((total / scores.length) * 100) / 100,
      highest: Math.max(...scores),
    };
  }, [rows]);

  const handleExport = async () => {
    if (!institutionId || !testId) {
      return;
    }

    exportMutation.mutate();
  };

  if (isLoading) {
    return (
      <section className="surface-card" style={{ padding: 'var(--space-5)' }}>
        Loading results...
      </section>
    );
  }

  return (
    <section
      className="page-main"
      aria-label="Institution test results"
      style={{ display: 'grid', gap: 'var(--space-4)' }}
    >
      <header
        className="surface-card"
        style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-2)' }}
      >
        <span className="label-text">Institution Results</span>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Test {testId} outcomes</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span className="ui-badge">Candidates: {stats.count}</span>
          <span className="ui-badge">Average score: {stats.average}</span>
          <span className="ui-badge">Highest score: {stats.highest}</span>
        </div>
      </header>

      {errorMessage || queryErrorMessage ? (
        <section className="surface-card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {errorMessage || queryErrorMessage}
          </p>
        </section>
      ) : null}

      <section
        className="surface-card"
        style={{
          padding: 'var(--space-4)',
          display: 'flex',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="ui-button ui-button-secondary"
        >
          {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
        </button>
        <button
          type="button"
          onClick={() =>
            navigate(`/institution/test/${testId}/lobby`)
          }
          className="ui-button ui-button-ghost"
        >
          Open Lobby
        </button>
        <button
          type="button"
          onClick={() => navigate('/institution/dashboard')}
          className="ui-button ui-button-ghost"
        >
          Back to Dashboard
        </button>
      </section>

      <section
        className="surface-card"
        style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}
      >
        <p className="label-text">Leaderboard</p>
        {!rows.length ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            No attempts submitted yet.
          </p>
        ) : (
          rows.map((row) => (
            <article
              key={row.attemptId}
              className="surface-elevated"
              style={{ padding: 'var(--space-2)', display: 'grid', gap: 'var(--space-1)' }}
            >
              <p style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
                #{row.rank} {row.candidateName}
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                Score {row.score} | Accuracy {row.accuracy}% | Time {row.timeTakenSeconds}s | Hints{' '}
                {row.hintUsage}
              </p>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                Status {row.status} | Tab switches {row.tabSwitchCount}
              </p>
            </article>
          ))
        )}
      </section>

      {(payload?.plagiarismFlags || []).length ? (
        <section
          className="surface-card"
          style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}
        >
          <p className="label-text">Plagiarism Flags</p>
          {(payload?.plagiarismFlags || []).map((flag, index) => (
            <article
              key={`${flag.attemptA}-${flag.attemptB}-${index}`}
              className="surface-elevated"
              style={{ padding: 'var(--space-2)' }}
            >
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
                Attempt {flag.attemptA} vs {flag.attemptB} | Similarity {flag.similarity}% |
                Question {flag.questionId}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {(payload?.fullscreenExitEvents || []).length ? (
        <section
          className="surface-card"
          style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}
        >
          <p className="label-text">Fullscreen Exit Alerts</p>
          {(payload?.fullscreenExitEvents || []).map((event, index) => (
            <article
              key={`${event.attemptId}-${event.exitedAt}-${index}`}
              className="surface-elevated"
              style={{ padding: 'var(--space-2)' }}
            >
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
                {event.candidateName} exited fullscreen at{' '}
                {event.exitedAt ? new Date(event.exitedAt).toLocaleString() : '-'}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {csvExport ? (
        <section
          className="surface-card"
          style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}
        >
          <p className="label-text">CSV Preview</p>
          <pre
            className="mono-panel"
            style={{
              margin: 0,
              padding: 'var(--space-3)',
              maxHeight: 260,
              overflow: 'auto',
              color: 'var(--color-text-secondary)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {csvExport}
          </pre>
        </section>
      ) : null}
    </section>
  );
}

export default InstitutionTestResultsPage;
