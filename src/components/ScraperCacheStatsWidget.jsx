import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getScraperDashboardStats } from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';

const REFRESH_INTERVAL_MS = 60000;

function formatUsd(value) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(4)}`;
}

function formatPercent(value) {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)}%`;
}

function ScraperCacheStatsWidget() {
  const {
    data: stats,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.scraperDashboardStats,
    queryFn: getScraperDashboardStats,
    staleTime: QUERY_STALE_TIMES.institution,
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const errorMessage = useMemo(() => {
    if (!error) {
      return '';
    }

    if (error?.status === 403) {
      return 'Cache stats are available for SUPER_ADMIN users only.';
    }

    return error instanceof Error ? error.message : 'Unable to load scraper cache stats';
  }, [error]);

  const queue = stats?.queue || {};
  const cache = stats?.groqCache || {};
  const budget = stats?.groqBudget || {};
  const topHints = cache?.topCachedHints || [];

  return (
    <section className="card-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Groq Cache and Scraper
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-text">
            Live Cost and Cache Efficiency
          </h2>
          <p className="mt-2 text-sm text-brand-muted">
            Aggregated cache hit-rate, token savings, daily Groq budget, and scraper queue health.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void refetch();
          }}
          className="rounded-xl border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-secondary"
        >
          Refresh
        </button>
      </div>

      {isLoading ? <p className="mt-4 text-sm text-brand-muted">Loading cache stats...</p> : null}
      {!isLoading && isFetching ? (
        <p className="mt-4 text-sm text-brand-muted">Refreshing cache stats...</p>
      ) : null}
      {errorMessage ? <p className="status-error mt-4">{errorMessage}</p> : null}

      {stats ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-xl border border-brand-border/70 bg-brand-elevated/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Cache Hit Rate
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {formatPercent(cache.hitRate)}
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Hits {cache.totalHits || 0} | Misses {cache.totalMisses || 0}
              </p>
            </article>

            <article className="rounded-xl border border-brand-border/70 bg-brand-elevated/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Estimated Tokens Saved
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {Number(cache.tokensSavedEstimate || 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Recovered via shared hint/review cache.
              </p>
            </article>

            <article className="rounded-xl border border-brand-border/70 bg-brand-elevated/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Budget Remaining
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {formatUsd(budget.remainingUsd)}
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Spent {formatUsd(budget.spentUsd)} of {formatUsd(budget.budgetUsd)}
              </p>
            </article>

            <article className="rounded-xl border border-brand-border/70 bg-brand-elevated/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Scraper Queue
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {queue.pending || 0} Pending
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Imported {queue.imported || 0} | Duplicate {queue.duplicate || 0} | Failed{' '}
                {queue.failed || 0}
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-xl border border-brand-border/70 bg-brand-elevated/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Top Cached Hints
            </p>
            <div className="mt-3 space-y-2">
              {topHints.length ? (
                topHints.slice(0, 5).map((item, index) => (
                  <div
                    key={`${item.problemId}-${item.hintNumber}-${index}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-border/60 bg-brand-panel/50 px-3 py-2 text-sm text-brand-text"
                  >
                    <p>
                      Problem {item.problemId} | Hint {item.hintNumber}
                    </p>
                    <p className="text-brand-muted">Used {item.usedCount || 0} times</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-brand-muted">No cached hint usage recorded yet.</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default ScraperCacheStatsWidget;
