import { useQuery } from '@tanstack/react-query';
import { BookOpenCheck, ChevronRight, Flame, Target, Timer, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { practiceProblems } from '../data/practiceProblems';
import { getMyAnalytics } from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';

/**
 * Student dashboard with progress snapshot, quick actions, and curated next problems.
 * @returns {JSX.Element} Dashboard page.
 */
function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: analytics } = useQuery({
    queryKey: queryKeys.myAnalytics,
    queryFn: getMyAnalytics,
    staleTime: QUERY_STALE_TIMES.dashboard,
    refetchInterval: 15_000,
  });

  const displayName = user?.name || user?.email?.split('@')[0] || 'Learner';
  const analyticsTotals = analytics?.totals || {};
  const streakDays = Number(analyticsTotals.streakDays || 0);
  const totalSolved = Number(analyticsTotals.totalSolved || 0);
  const totalAttempts = Number(analyticsTotals.totalAttempts || 0);
  const codeQualityScore = analytics?.scores?.codeQuality;

  const independenceScore = analytics?.independenceScore ?? analytics?.scores?.independence ?? null;
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

  const targetSessionMinutes = useMemo(() => {
    if (!totalAttempts) {
      return 45;
    }
    return Math.min(90, Math.max(30, Math.round(totalAttempts * 1.5)));
  }, [totalAttempts]);

  const weakestTopicName = useMemo(() => {
    const entries = Object.entries(analytics?.topicScores || {})
      .map(([topic, score]) => [topic, Number(score || 0)])
      .filter(([, score]) => Number.isFinite(score));

    if (!entries.length) {
      return '';
    }

    entries.sort((left, right) => left[1] - right[1]);
    return entries[0][0] || '';
  }, [analytics?.topicScores]);

  const sessionPlan = useMemo(() => {
    const warmupMinutes = Math.max(10, Math.min(20, Math.round(targetSessionMinutes * 0.25)));
    const reviewMinutes = Math.max(8, Math.min(15, Math.round(targetSessionMinutes * 0.2)));
    const coreMinutes = Math.max(15, targetSessionMinutes - warmupMinutes - reviewMinutes);

    const focusedTopic = weakestTopicName || 'recently attempted topics';

    return [
      {
        key: 'warmup',
        title: 'Warm-up',
        action:
          totalSolved < 5 ? 'Solve 1 easy fundamentals problem' : 'Solve 1 easy recap problem',
        duration: `${warmupMinutes} minutes`,
      },
      {
        key: 'core',
        title: 'Core Block',
        action: `Focused drill on ${focusedTopic}`,
        duration: `${coreMinutes} minutes`,
      },
      {
        key: 'review',
        title: 'Review',
        action:
          independenceScore != null && independenceScore < 60
            ? 'Re-solve one run without hints and compare changes'
            : codeQualityScore != null && codeQualityScore < 70
              ? 'Refactor one recent solution for clarity and edge cases'
              : 'Write a short post-mortem for your hardest solved problem',
        duration: `${reviewMinutes} minutes`,
      },
    ];
  }, [codeQualityScore, independenceScore, targetSessionMinutes, totalSolved, weakestTopicName]);

  const summaryCards = [
    {
      title: 'Current Streak',
      value: `${streakDays} days`,
      hint: `${totalAttempts} recorded attempts`,
      icon: Flame,
      color: 'var(--color-warning)',
    },
    {
      title: 'Practice Coverage',
      value: `${totalSolved} solved`,
      hint: `${practiceProblems.length} total problems`,
      icon: BookOpenCheck,
      color: 'var(--color-accent-primary)',
    },
    {
      title: 'Independence Score',
      value: independenceScore == null ? '--' : `${Math.round(independenceScore)}%`,
      hint: 'Lower hint dependency is better',
      icon: Target,
      color: 'var(--color-info)',
    },
    {
      title: 'Accuracy Trend',
      value: codeQualityScore == null ? '--' : `${Math.round(codeQualityScore)} CQ`,
      hint:
        codeQualityScore == null
          ? 'Run submissions to generate quality trend'
          : 'Code quality score',
      icon: TrendingUp,
      color: 'var(--color-success)',
    },
  ];

  const heatmapLevels = useMemo(() => {
    const cells = (analytics?.heatmap || []).slice(-26 * 7);
    if (!cells.length) {
      return Array.from({ length: 26 * 7 }, () => 0);
    }

    const maxSolved = Math.max(...cells.map((entry) => Number(entry.solved || 0)), 1);
    const normalized = cells.map((entry) => {
      const solved = Number(entry.solved || 0);
      return Math.min(Math.round((solved / maxSolved) * 3), 3);
    });

    const missingCount = Math.max(26 * 7 - normalized.length, 0);
    return [...Array.from({ length: missingCount }, () => 0), ...normalized];
  }, [analytics?.heatmap]);

  const recommendedProblems = useMemo(
    () =>
      [...practiceProblems]
        .sort((left, right) => {
          if (left.difficulty === right.difficulty) {
            return left.title.localeCompare(right.title);
          }

          const weight = { Easy: 1, Medium: 2, Hard: 3 };
          return weight[left.difficulty] - weight[right.difficulty];
        })
        .slice(0, 6),
    []
  );

  return (
    <section
      className="page-main"
      aria-label="Dashboard overview"
      style={{ display: 'grid', gap: 'var(--space-5)' }}
    >
      <header
        className="surface-card mesh-hero"
        style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-4)' }}
      >
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gap: 'var(--space-2)' }}>
          <span className="label-text">Dashboard</span>
          <h1 style={{ fontSize: 'var(--text-4xl)' }}>Welcome back, {displayName}</h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: 780 }}>
            Keep your momentum. Pick the next challenge, stay consistent, and stack high-quality
            solve sessions.
          </p>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)',
          }}
        >
          <Button onClick={() => navigate('/problems')}>Start Practice</Button>
          <Button variant="secondary" onClick={() => navigate('/progress')}>
            View Progress
          </Button>
          <Button variant="secondary" onClick={() => navigate('/analytics')}>
            Deep Analytics
          </Button>
          <Button variant="ghost" onClick={() => navigate('/editor')}>
            Open Editor
          </Button>
        </div>

        <div
          className="surface-elevated"
          style={{
            position: 'relative',
            zIndex: 1,
            padding: 'var(--space-2) var(--space-3)',
            display: 'inline-flex',
            gap: 'var(--space-2)',
            alignItems: 'center',
            width: 'fit-content',
            borderColor: analyticsUpdating
              ? 'color-mix(in srgb, var(--color-warning) 45%, var(--color-border))'
              : undefined,
          }}
        >
          <span className="label-text">Analytics</span>
          <strong
            style={{
              color: analyticsUpdating ? 'var(--color-warning)' : 'var(--color-accent-primary)',
            }}
          >
            {analyticsUpdating ? 'Updating...' : 'Ready'}
          </strong>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
            {analyticsStatusCaption}
          </span>
        </div>

        {independenceScore != null ? (
          <div
            className="surface-elevated"
            style={{
              position: 'relative',
              zIndex: 1,
              padding: 'var(--space-3)',
              display: 'inline-flex',
              gap: 'var(--space-2)',
              alignItems: 'center',
              width: 'fit-content',
            }}
          >
            <span className="label-text">Independence</span>
            <strong style={{ color: 'var(--color-accent-primary)' }}>
              {Math.round(independenceScore)}%
            </strong>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              Updated from hint telemetry
            </span>
          </div>
        ) : null}
      </header>

      <section className="stat-grid" aria-label="Performance highlights">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.title}
              className="surface-card"
              style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-3)' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                }}
              >
                <p className="label-text">{card.title}</p>
                <Icon size={16} color={card.color} />
              </div>
              <strong style={{ fontSize: 'var(--text-2xl)' }}>{card.value}</strong>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                {card.hint}
              </p>
            </article>
          );
        })}
      </section>

      <section
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(340px, 100%), 1fr))',
        }}
      >
        <article
          className="surface-card"
          style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)' }}
        >
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <div>
              <p className="label-text">Consistency</p>
              <h2 style={{ fontSize: 'var(--text-xl)' }}>Daily Practice Heatmap</h2>
            </div>
            <span className="ui-badge">Last 26 weeks</span>
          </header>

          <div className="contribution-grid" aria-label="Contribution intensity grid">
            {heatmapLevels.map((level, index) => (
              <div
                key={`${level}-${index}`}
                className="contribution-cell"
                data-level={String(level)}
                role="presentation"
              />
            ))}
          </div>

          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Darker cells represent higher solve intensity. Keep at least one active cell per day to
            preserve your streak.
          </p>
        </article>

        <article
          className="surface-card"
          style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)' }}
        >
          <header style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <p className="label-text">Next Best Actions</p>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Session Plan</h2>
          </header>

          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {sessionPlan.map((planItem) => (
              <article
                key={planItem.key}
                className="surface-elevated"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-1)' }}
              >
                <span className="label-text">{planItem.title}</span>
                <strong>{planItem.action}</strong>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {planItem.duration}
                </span>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section
        className="surface-card"
        style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-4)' }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p className="label-text">Curated</p>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Recommended Next Problems</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('/problems')}>
            Open Full Catalog
          </Button>
        </header>

        <div
          style={{
            display: 'grid',
            gap: 'var(--space-3)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          }}
        >
          {recommendedProblems.map((problem) => (
            <article
              key={problem.id}
              className="surface-elevated"
              style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-3)' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2)',
                }}
              >
                <h3 style={{ fontSize: 'var(--text-base)' }}>{problem.title}</h3>
                <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
                  <span className="tiny-dot" />
                  {problem.difficulty}
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                <span className="ui-badge">{problem.topic}</span>
                <span className="ui-badge">{problem.pattern}</span>
              </div>
              <Button variant="secondary" onClick={() => navigate(`/editor/${problem.id}`)}>
                Solve Problem
                <ChevronRight size={14} />
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section
        className="surface-card"
        style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-3)' }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p className="label-text">Daily Rhythm</p>
            <h2 style={{ fontSize: 'var(--text-xl)' }}>Today at a Glance</h2>
          </div>
          <span className="ui-badge">
            <Timer size={14} />
            Target session: {targetSessionMinutes} min
          </span>
        </header>

        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: 'var(--space-2)',
          }}
        >
          <li
            className="surface-elevated"
            style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}
          >
            Solved {totalSolved} problems across {totalAttempts} tracked attempts.
          </li>
          <li
            className="surface-elevated"
            style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}
          >
            Independence score is{' '}
            {independenceScore == null ? 'pending telemetry' : `${Math.round(independenceScore)}%`}.
          </li>
          <li
            className="surface-elevated"
            style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)' }}
          >
            {analyticsUpdating
              ? 'Analytics refresh is in progress for your latest activity.'
              : 'Analytics is current, so this plan reflects your latest submissions.'}
          </li>
        </ul>
      </section>
    </section>
  );
}

export default Dashboard;
