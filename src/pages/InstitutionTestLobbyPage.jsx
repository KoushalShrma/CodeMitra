import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getInstituteTestDetails,
  getInstitutionTestV2,
  joinInstitutionTest,
} from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';
import { getInstitutionSession } from '../utils/institutionSession';

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString();
}

function InstitutionTestLobbyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { testId } = useParams();
  const query = new URLSearchParams(location.search);
  const institutionId = query.get('institutionId') || String(getInstitutionSession()?.institution?.id || '');

  const [errorMessage, setErrorMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.institutionTest(institutionId, testId),
    queryFn: () =>
      institutionId ? getInstitutionTestV2(institutionId, testId) : getInstituteTestDetails(testId),
    enabled: Boolean(testId),
    staleTime: QUERY_STALE_TIMES.institution,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinInstitutionTest(testId),
    onSuccess: (payload) => {
      const attemptId = payload?.attempt?.id;
      if (!attemptId) {
        setErrorMessage('Attempt id was not returned by join endpoint');
        return;
      }

      navigate(
        `/institution/test/${testId}/attempt/${attemptId}`
      );
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to join test');
    },
  });

  const testDetails = data?.test || data || null;
  const isJoining = joinMutation.isPending;
  const queryErrorMessage = error instanceof Error ? error.message : '';
  const canJoinAsCandidate = !institutionId;

  const backPath = useMemo(() => {
    if (institutionId) {
      return '/institution/dashboard';
    }
    return '/student-tests';
  }, [institutionId]);

  const handleJoin = async () => {
    if (!testId) {
      return;
    }

    setErrorMessage('');
    joinMutation.mutate();
  };

  if (isLoading) {
    return (
      <section className="surface-card" style={{ padding: 'var(--space-5)' }}>
        Loading test lobby...
      </section>
    );
  }

  return (
    <section
      className="page-main"
      aria-label="Test lobby"
      style={{ display: 'grid', gap: 'var(--space-4)' }}
    >
      <header
        className="surface-card"
        style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-2)' }}
      >
        <span className="label-text">Test Lobby</span>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>{testDetails?.title || `Test ${testId}`}</h1>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: 800 }}>
          {testDetails?.description || 'Join this test to start your timed coding attempt.'}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <span className="ui-badge">Start: {formatDateTime(testDetails?.startTime)}</span>
          <span className="ui-badge">End: {formatDateTime(testDetails?.endTime)}</span>
          <span className="ui-badge">
            Duration: {testDetails?.durationMinutes || testDetails?.duration || 0} mins
          </span>
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
        {canJoinAsCandidate ? (
          <button
            type="button"
            onClick={handleJoin}
            disabled={isJoining}
            className="ui-button ui-button-primary"
          >
            {isJoining ? 'Joining...' : 'Join Test'}
          </button>
        ) : null}
        {institutionId ? (
          <button
            type="button"
            onClick={() =>
              navigate(`/institution/test/${testId}/results`)
            }
            className="ui-button ui-button-secondary"
          >
            View Results
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="ui-button ui-button-ghost"
        >
          Back
        </button>
      </section>
    </section>
  );
}

export default InstitutionTestLobbyPage;
