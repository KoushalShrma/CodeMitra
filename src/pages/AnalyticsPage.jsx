import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../components/ui/Button';
import { getMyAnalytics, getMyTopicAnalytics, recalculateMyAnalytics } from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';

const HINT_COLORS = ['#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444'];

function scoreTone(value) {
  if (value >= 80) {
    return 'var(--color-success)';
  }
  if (value >= 60) {
    return 'var(--color-warning)';
  }
  return 'var(--color-danger)';
}

function normalizeDate(value) {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function AnalyticsPage() {
  const queryClient = useQueryClient();
  const [selectedTopic, setSelectedTopic] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: analytics,
    isLoading,
    error: analyticsError,
  } = useQuery({
    queryKey: queryKeys.myAnalytics,
    queryFn: getMyAnalytics,
    staleTime: QUERY_STALE_TIMES.dashboard,
    refetchInterval: 15_000,
  });

  const analyticsUpdating = Boolean(analytics?.updating || analytics?.stale);

  const analyticsStatusCaption = (() => {
    const staleSince = analytics?.staleSince;
    const updatedAt = analytics?.updatedAt;

    if (analyticsUpdating && staleSince) {
      const parsed = new Date(staleSince);
      if (!Number.isNaN(parsed.getTime())) {
        return `Queued since ${parsed.toLocaleTimeString()}`;
      }
    }

    if (updatedAt) {
      const parsed = new Date(updatedAt);
      if (!Number.isNaN(parsed.getTime())) {
        return `Last updated ${parsed.toLocaleTimeString()}`;
      }
    }

    return analyticsUpdating ? 'Recent events are being processed.' : 'Analytics is up to date.';
  })();

  const topicOptions = Object.keys(analytics?.topicScores || {});
  const effectiveTopic =
    selectedTopic && topicOptions.includes(selectedTopic) ? selectedTopic : topicOptions[0] || '';

  const { data: topicBreakdown, isLoading: isTopicLoading } = useQuery({
    queryKey: queryKeys.myTopicAnalytics(effectiveTopic),
    queryFn: () => getMyTopicAnalytics(effectiveTopic),
    enabled: Boolean(effectiveTopic),
    staleTime: QUERY_STALE_TIMES.interactive,
  });

  const recalculateMutation = useMutation({
    mutationFn: () => recalculateMyAnalytics(),
    onSuccess: async () => {
      setErrorMessage('');
      await queryClient.invalidateQueries({ queryKey: queryKeys.myAnalytics });
      if (effectiveTopic) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.myTopicAnalytics(effectiveTopic),
        });
      }
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to recalculate analytics');
    },
  });

  const scoreCards = useMemo(() => {
    const scores = analytics?.scores || {};
    return [
      { label: 'Consistency', key: 'consistency', value: Number(scores.consistency || 0) },
      { label: 'Independence', key: 'independence', value: Number(scores.independence || 0) },
      {
        label: 'Speed Percentile',
        key: 'speedPercentile',
        value: Number(scores.speedPercentile || 0),
      },
      { label: 'Code Quality', key: 'codeQuality', value: Number(scores.codeQuality || 0) },
      { label: 'Overall Rank', key: 'overallRank', value: Number(scores.overallRank || 0) },
    ];
  }, [analytics]);

  const radarData = useMemo(
    () =>
      Object.entries(analytics?.radar || {}).map(([subject, value]) => ({
        subject,
        score: Number(value || 0),
      })),
    [analytics]
  );

  const hintUsageData = useMemo(() => {
    const usage = analytics?.hintUsage || {};
    return [
      { name: '0 hints', value: Number(usage.zero || 0) },
      { name: '1 hint', value: Number(usage.one || 0) },
      { name: '2 hints', value: Number(usage.two || 0) },
      { name: '3+ hints', value: Number(usage.threePlus || 0) },
    ];
  }, [analytics]);

  const codeQualityTimeline = useMemo(
    () =>
      (analytics?.codeQualityTimeline || []).map((entry, index) => ({
        ...entry,
        label: normalizeDate(entry.date) || `Run ${index + 1}`,
        score: Number(entry.score || 0),
      })),
    [analytics]
  );

  const chessDistribution = useMemo(
    () =>
      Object.entries(analytics?.chessRatings || {}).map(([name, value]) => ({
        name,
        value: Number(value || 0),
      })),
    [analytics]
  );

  const comparisonData = useMemo(() => {
    const comparison = analytics?.comparison || {};
    return [
      {
        name: 'You',
        score: Number(comparison?.user?.overallRank || 0),
      },
      {
        name: 'Platform Avg',
        score: Number(comparison?.platformAverage?.overallRank || 0),
      },
      {
        name: 'Top 10%',
        score: Number(comparison?.topTenPercent?.overallRank || 0),
      },
    ];
  }, [analytics]);

  const heatmapCells = useMemo(() => {
    const rows = (analytics?.heatmap || []).slice(-90);
    if (!rows.length) {
      return [];
    }

    const maxSolved = Math.max(...rows.map((item) => Number(item.solved || 0)), 1);
    return rows.map((item) => {
      const solved = Number(item.solved || 0);
      const level = Math.min(Math.floor((solved / maxSolved) * 3), 3);
      return {
        ...item,
        solved,
        level,
      };
    });
  }, [analytics]);

  const handleRecalculate = async () => {
    try {
      await recalculateMutation.mutateAsync();
    } catch {
      // Error state is already handled by mutation onError.
    }
  };

  const queryErrorMessage = analyticsError instanceof Error ? analyticsError.message : '';

  if (isLoading) {
    return (
      <section className="surface-card" style={{ padding: 'var(--space-5)' }}>
        Loading analytics...
      </section>
    );
  }

  if ((errorMessage || queryErrorMessage) && !analytics) {
    return (
      <section className="surface-card" style={{ padding: 'var(--space-5)' }}>
        <p style={{ color: 'var(--color-danger)' }}>{errorMessage || queryErrorMessage}</p>
      </section>
    );
  }

  return (
    <section
      className="page-main"
      aria-label="Analytics deep dive"
      style={{ display: 'grid', gap: 'var(--space-5)' }}
    >
      <header
        className="surface-card mesh-hero"
        style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)' }}
      >
        <span className="label-text" style={{ position: 'relative', zIndex: 1 }}>
          Analytics
        </span>
        <h1 style={{ fontSize: 'var(--text-3xl)', position: 'relative', zIndex: 1 }}>
          Performance Intelligence Console
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            maxWidth: 860,
            position: 'relative',
            zIndex: 1,
          }}
        >
          This page combines consistency, independence, speed, and code-quality telemetry into one
          scorecard. Independence is now first-class and updates whenever hints are used or blocked
          by cooldown.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Button onClick={() => void handleRecalculate()} disabled={recalculateMutation.isPending}>
            {recalculateMutation.isPending ? 'Recalculating...' : 'Recalculate Scores'}
          </Button>
          <span
            className="ui-badge"
            style={{
              borderColor: analyticsUpdating
                ? 'color-mix(in srgb, var(--color-warning) 45%, var(--color-border))'
                : undefined,
              color: analyticsUpdating ? 'var(--color-warning)' : undefined,
            }}
          >
            {analyticsUpdating ? 'Updating...' : 'Ready'} | {analyticsStatusCaption}
          </span>
          {errorMessage ? (
            <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>
              {errorMessage}
            </span>
          ) : null}
        </div>
      </header>

      <section className="stat-grid" aria-label="Analytics scorecards">
        {scoreCards.map((card) => (
          <article
            key={card.key}
            className="surface-card"
            style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}
          >
            <span className="label-text">{card.label}</span>
            <strong style={{ fontSize: 'var(--text-2xl)', color: scoreTone(card.value) }}>
              {Math.round(card.value)}
            </strong>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              / 100
            </span>
          </article>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        }}
      >
        <article className="surface-card" style={{ padding: 'var(--space-4)', minHeight: 340 }}>
          <p className="label-text">Topic Radar</p>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              marginTop: 'var(--space-1)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Topic Proficiency Map
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
              />
              <PolarRadiusAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
              />
              <Radar
                dataKey="score"
                stroke="var(--color-accent-primary)"
                fill="var(--color-accent-primary)"
                fillOpacity={0.32}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </article>

        <article className="surface-card" style={{ padding: 'var(--space-4)', minHeight: 340 }}>
          <p className="label-text">Hint Dependency</p>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              marginTop: 'var(--space-1)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Hint Usage Distribution
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={hintUsageData}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={86}
                paddingAngle={3}
              >
                {hintUsageData.map((entry, index) => (
                  <Cell key={entry.name} fill={HINT_COLORS[index % HINT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        }}
      >
        <article className="surface-card" style={{ padding: 'var(--space-4)', minHeight: 340 }}>
          <p className="label-text">Code Quality Trend</p>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              marginTop: 'var(--space-1)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Review Score Timeline
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={codeQualityTimeline}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-accent-secondary)"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="surface-card" style={{ padding: 'var(--space-4)', minHeight: 340 }}>
          <p className="label-text">Platform Positioning</p>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              marginTop: 'var(--space-1)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Overall Rank Comparison
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="var(--color-accent-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </article>
      </section>

      <section
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))',
        }}
      >
        <article className="surface-card" style={{ padding: 'var(--space-4)', minHeight: 320 }}>
          <p className="label-text">Chess Ratings</p>
          <h2
            style={{
              fontSize: 'var(--text-lg)',
              marginTop: 'var(--space-1)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Submission Verdict Quality
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chessDistribution}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chessDistribution.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.name === 'Brilliant'
                        ? '#22c55e'
                        : entry.name === 'Blunder'
                          ? '#ef4444'
                          : '#0ea5e9'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article
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
            <div>
              <p className="label-text">Topic Drilldown</p>
              <h2 style={{ fontSize: 'var(--text-lg)', marginTop: 'var(--space-1)' }}>
                Attempts by Topic
              </h2>
            </div>
            <select
              value={effectiveTopic}
              onChange={(event) => setSelectedTopic(event.target.value)}
              className="ui-select"
              style={{ maxWidth: 220 }}
            >
              {!topicOptions.length ? <option value="">No topics available</option> : null}
              {topicOptions.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>

          {isTopicLoading ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Loading topic breakdown...
            </p>
          ) : topicBreakdown?.attempts?.length ? (
            <div
              style={{ display: 'grid', gap: 'var(--space-2)', maxHeight: 220, overflow: 'auto' }}
            >
              {topicBreakdown.attempts.slice(0, 8).map((attempt, index) => (
                <article
                  key={`${attempt.problemId}-${index}`}
                  className="surface-elevated"
                  style={{ padding: 'var(--space-2)', display: 'grid', gap: 'var(--space-1)' }}
                >
                  <p
                    style={{
                      color: 'var(--color-text-primary)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                    }}
                  >
                    {attempt.problemId}
                  </p>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                    Verdict {attempt.verdict} | Runs {attempt.runCount} | Hints{' '}
                    {attempt.hintsRequested}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              No attempts recorded for the selected topic yet.
            </p>
          )}
        </article>
      </section>

      <section
        className="surface-card"
        style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}
      >
        <p className="label-text">Solve Heatmap</p>
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Recent solve intensity (last 90 events)</h2>
        {!heatmapCells.length ? (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            No solved-attempt heatmap data yet.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-1)',
              gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
            }}
          >
            {heatmapCells.map((cell) => (
              <div
                key={`${cell.date}-${cell.solved}`}
                title={`${cell.date}: ${cell.solved} solved`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                  background:
                    cell.level === 0
                      ? 'color-mix(in srgb, var(--color-bg-elevated) 88%, transparent)'
                      : cell.level === 1
                        ? 'color-mix(in srgb, var(--color-accent-primary) 30%, transparent)'
                        : cell.level === 2
                          ? 'color-mix(in srgb, var(--color-accent-primary) 55%, transparent)'
                          : 'color-mix(in srgb, var(--color-accent-primary) 80%, transparent)',
                }}
              />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default AnalyticsPage;
