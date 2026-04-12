import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AccuracyLineChart from '../components/progress/AccuracyLineChart';
import ProgressDistributionChart from '../components/progress/ProgressDistributionChart';
import TopicPerformanceChart from '../components/progress/TopicPerformanceChart';
import { getUserProgress } from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';
import { getLoggedInUser } from '../utils/authStorage';

function formatDate(value) {
  if (!value) {
    return 'Recently';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function OverviewCard({ label, value, accent, trend }) {
  return (
    <div className="premium-card bg-gradient-to-b from-brand-surface/90 to-brand-surface/65">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${accent}`}>{value}</p>
      <p className="mt-2 text-sm text-brand-muted">{trend}</p>
    </div>
  );
}

function MoveCard({ icon, title, value, toneClass, description }) {
  return (
    <div className="premium-card">
      <div className="flex items-center gap-3">
        <div
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${toneClass}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-text">{title}</p>
          <p className="text-xs text-brand-muted">{description}</p>
        </div>
      </div>
      <p className={`mt-5 text-3xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function ActivityBadge({ status }) {
  const tone =
    status === 'Great'
      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
      : status === 'Mistake'
        ? 'border-amber-400/30 bg-amber-400/10 text-amber-300'
        : 'border-rose-400/30 bg-rose-400/10 text-rose-300';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tone}`}>{status}</span>
  );
}

function ProgressPage() {
  const user = getLoggedInUser();
  const {
    data: progress,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.userProgress(user?.id),
    queryFn: () => getUserProgress(user.id),
    enabled: Boolean(user?.id),
    staleTime: QUERY_STALE_TIMES.dashboard,
  });

  const errorMessage = !user?.id
    ? 'Please log in to view progress.'
    : error instanceof Error
      ? error.message
      : '';

  const completionRate = useMemo(() => {
    if (!progress?.totalProblems) {
      return 0;
    }

    return Math.round(((progress.completedProblems || 0) / progress.totalProblems) * 100);
  }, [progress]);

  const accuracyTrendData = useMemo(
    () =>
      (progress?.accuracyTrend || []).map((entry) => ({
        ...entry,
        label: formatDate(entry.date),
      })),
    [progress]
  );

  const distributionData = useMemo(
    () => [
      { name: 'Great', value: progress?.greatMoves || 0 },
      { name: 'Mistake', value: progress?.mistakes || 0 },
      { name: 'Blunder', value: progress?.blunders || 0 },
    ],
    [progress]
  );

  const topicData = useMemo(() => (progress?.topicStats || []).slice(0, 6), [progress]);

  if (isLoading) {
    return (
      <section className="premium-card text-sm text-brand-muted">
        Loading progress dashboard...
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="premium-card">
        <p className="status-error m-0">{errorMessage}</p>
      </section>
    );
  }

  return (
    <section className="premium-page">
      <header className="premium-hero subtle-grid overflow-hidden">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
              Progress Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-brand-text sm:text-4xl">
              Your coding journey, visualized like a game board
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-muted sm:text-base">
              Track wins, spot weak areas, and build momentum with clear feedback across problems,
              topics, and recent runs.
            </p>
          </div>

          <div className="rounded-3xl border border-brand-secondary/25 bg-brand-bg/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
              AI Insight
            </p>
            <p className="mt-4 text-lg font-semibold text-brand-text">{progress?.aiInsight}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
                  Strong Area
                </p>
                <p className="mt-2 text-base font-semibold text-emerald-300">
                  {progress?.strongArea}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
                  Focus Next
                </p>
                <p className="mt-2 text-base font-semibold text-amber-300">{progress?.weakArea}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewCard
          label="Completed Problems"
          value={`${progress?.completedProblems || 0}/${progress?.totalProblems || 0}`}
          accent="text-brand-text"
          trend={`${completionRate}% of the practice map completed`}
        />
        <OverviewCard
          label="Total Runs"
          value={progress?.totalRuns || 0}
          accent="text-brand-secondary"
          trend="Every run adds another datapoint to your growth"
        />
        <OverviewCard
          label="Overall Accuracy"
          value={`${progress?.accuracy || 0}%`}
          accent="text-emerald-300"
          trend="Measured across all judged practice runs"
        />
        <OverviewCard
          label="Momentum"
          value={progress?.greatMoves || 0}
          accent="text-brand-accent"
          trend="Great runs that landed cleanly"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <MoveCard
          icon={'\u2705'}
          title="Great Moves"
          value={progress?.greatMoves || 0}
          toneClass="text-emerald-300"
          description="All test cases passed"
        />
        <MoveCard
          icon={'\u26A0\uFE0F'}
          title="Mistakes"
          value={progress?.mistakes || 0}
          toneClass="text-amber-300"
          description="Some progress, but logic still slips"
        />
        <MoveCard
          icon={'\u274C'}
          title="Blunders"
          value={progress?.blunders || 0}
          toneClass="text-rose-300"
          description="A signal to revisit the pattern"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AccuracyLineChart data={accuracyTrendData} />
        </div>
        <ProgressDistributionChart data={distributionData} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <TopicPerformanceChart data={topicData} />

        <div className="premium-card">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
            Weak / Strong Areas
          </p>
          <div className="mt-5 space-y-4">
            {(progress?.topicStats || []).slice(0, 5).map((topic) => (
              <div key={topic.topic}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-brand-text">{topic.topic}</span>
                  <span className="text-brand-muted">{topic.accuracy}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-brand-elevated/55">
                  <div
                    className={`h-full rounded-full ${
                      topic.accuracy >= 75
                        ? 'bg-emerald-400'
                        : topic.accuracy >= 50
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                    }`}
                    style={{ width: `${Math.max(topic.accuracy, 6)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="premium-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
              Recent Activity
            </p>
            <h3 className="mt-2 text-lg font-semibold text-brand-text">Latest practice trail</h3>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {(progress?.activity || []).length ? (
            progress.activity.map((entry) => (
              <div
                key={`${entry.problem}-${entry.date}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-border/65 bg-brand-elevated/25 px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-brand-text">{entry.problem}</p>
                  <p className="mt-1 text-sm text-brand-muted">
                    {entry.topic} | {formatDate(entry.date)}
                  </p>
                </div>
                <ActivityBadge status={entry.status} />
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-muted">
              Start practicing to unlock charts, topic stats, and your activity history.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProgressPage;
