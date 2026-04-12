import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getActiveStudentTests } from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';

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

function getMinutesRemaining(endTime) {
  const parsed = new Date(endTime || '');
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return Math.max(Math.floor((parsed.getTime() - Date.now()) / 60_000), 0);
}

function Contests() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.studentTestsActive,
    queryFn: getActiveStudentTests,
    staleTime: QUERY_STALE_TIMES.interactive,
    refetchInterval: 20_000,
  });

  const contests = data?.tests || [];
  const errorMessage = error instanceof Error ? error.message : '';

  return (
    <section className="space-y-8 fade-slide-in">
      <div className="card-surface relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-8 h-40 w-40 rounded-full bg-brand-secondary/25 blur-3xl" />
        <p className="relative text-sm font-medium text-brand-accent">Live Contests</p>
        <h1 className="relative mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Active Coding Battles
        </h1>
        <p className="relative mt-3 max-w-3xl text-sm leading-7 text-brand-muted">
          Join currently active contests, monitor end times, and jump into the test center to submit
          solutions.
        </p>
      </div>

      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}

      {isLoading ? (
        <div className="card-surface p-6 text-sm text-brand-muted">Loading active contests...</div>
      ) : contests.length === 0 ? (
        <div className="card-surface p-6 text-sm text-brand-muted">
          No active contests are available right now.
        </div>
      ) : (
        <div className="grid gap-5">
          {contests.map((contest) => {
            const minutesRemaining = getMinutesRemaining(contest.endTime);

            return (
              <article key={contest.id} className="card-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-brand-text">{contest.title}</h2>
                    <p className="text-sm leading-6 text-brand-muted">
                      {contest.description || 'No description provided.'}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-brand-muted">
                      <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                        Duration: {contest.duration} mins
                      </span>
                      <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                        Starts: {formatDateTime(contest.startTime)}
                      </span>
                      <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                        Ends: {formatDateTime(contest.endTime)}
                      </span>
                      {minutesRemaining != null ? (
                        <span className="rounded-full border border-brand-secondary/45 bg-brand-secondary/10 px-3 py-1 text-brand-text">
                          {minutesRemaining} min left
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/student-tests')}
                    className="rounded-xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(34,198,163,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105"
                  >
                    Open Test Center
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Contests;
