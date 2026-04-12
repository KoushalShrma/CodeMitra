import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import {
  getInstitution,
  getInstitutionCurrentProfile,
  getInstitutionTestsV2,
} from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';
import {
  clearInstitutionSession,
  getInstitutionSession,
  setInstitutionSession,
} from '../utils/institutionSession';

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

function InstituteDashboard() {
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ['institutionAuthProfile'],
    queryFn: getInstitutionCurrentProfile,
    staleTime: QUERY_STALE_TIMES.profile,
  });

  const institution = profileQuery.data?.institution || getInstitutionSession()?.institution || null;
  const institutionId = institution?.id ? String(institution.id) : '';

  useEffect(() => {
    if (!profileQuery.data?.institution) {
      return;
    }

    const current = getInstitutionSession() || {};
    setInstitutionSession({
      ...current,
      institution: profileQuery.data.institution,
    });
  }, [profileQuery.data]);

  const institutionQuery = useQuery({
    queryKey: queryKeys.institutionWorkspace(institutionId),
    queryFn: () => getInstitution(institutionId),
    enabled: Boolean(institutionId),
    staleTime: QUERY_STALE_TIMES.institution,
  });

  const testsQuery = useQuery({
    queryKey: queryKeys.institutionTests(institutionId),
    queryFn: () => getInstitutionTestsV2(institutionId),
    enabled: Boolean(institutionId),
    staleTime: QUERY_STALE_TIMES.institution,
  });

  const tests = useMemo(() => testsQuery.data?.tests || [], [testsQuery.data]);
  const queryErrorMessage =
    profileQuery.error instanceof Error
      ? profileQuery.error.message
      : institutionQuery.error instanceof Error
        ? institutionQuery.error.message
        : testsQuery.error instanceof Error
          ? testsQuery.error.message
          : '';

  return (
    <section
      className="page-main"
      aria-label="Institution dashboard"
      style={{ display: 'grid', gap: 'var(--space-5)' }}
    >
      <header
        className="surface-card mesh-hero"
        style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)' }}
      >
        <span className="label-text" style={{ position: 'relative', zIndex: 1 }}>
          Institution Workspace
        </span>
        <h1 style={{ fontSize: 'var(--text-3xl)', position: 'relative', zIndex: 1 }}>
          Welcome, {institution?.name || 'Institution Admin'}
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            maxWidth: 860,
            position: 'relative',
            zIndex: 1,
          }}
        >
          Create tests, review candidate reports, and manage institution member access from one
          dedicated portal.
        </p>
      </header>

      {queryErrorMessage ? (
        <section className="surface-card" style={{ padding: 'var(--space-4)' }}>
          <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
            {queryErrorMessage}
          </p>
        </section>
      ) : null}

      <section
        className="surface-card"
        style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <div>
            <p className="label-text">Institution Profile</p>
            <h2 style={{ fontSize: 'var(--text-xl)', marginTop: 'var(--space-1)' }}>
              {institution?.name || '-'}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Type {institution?.type || '-'} | Tier {institution?.subscriptionTier || '-'} | Code{' '}
              {institution?.code || '-'}
            </p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              Login email {institution?.loginEmail || institution?.officialEmail || '-'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Button onClick={() => navigate('/institution/create-test')}>Create Test</Button>
            <Button variant="secondary" onClick={() => navigate('/institution/members')}>
              Manage Members
            </Button>
            <Button variant="secondary" onClick={() => navigate('/institution/analytics')}>
              Open Analytics
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearInstitutionSession();
                navigate('/institution/login', { replace: true });
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </section>

      <section
        className="surface-card"
        style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          <p className="label-text">Tests</p>
          {testsQuery.isLoading ? (
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              Refreshing...
            </span>
          ) : null}
        </div>

        {!tests.length ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            No tests found for this institution yet.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            {tests.slice(0, 8).map((test) => (
              <article
                key={test.id}
                className="surface-elevated"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 'var(--text-base)' }}>{test.title}</strong>
                    <p
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--text-xs)',
                      }}
                    >
                      {formatDateTime(test.startTime)} to {formatDateTime(test.endTime)}
                    </p>
                    <p
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--text-xs)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      Join code {test.joinCode || '-'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {test.joinCode ? (
                      <Button
                        variant="ghost"
                        onClick={() => navigator.clipboard.writeText(test.joinCode)}
                      >
                        Copy Code
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      onClick={() => navigate(`/institution/test/${test.id}/lobby`)}
                    >
                      Lobby
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/institution/test/${test.id}/results`)}
                    >
                      Results
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default InstituteDashboard;
