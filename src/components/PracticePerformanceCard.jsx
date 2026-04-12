import { useEffect, useMemo, useRef, useState } from 'react';

function PracticePerformanceCard({ stats, score = 0, totalPenaltyPoints = 0 }) {
  const [animatedStats, setAnimatedStats] = useState(stats);
  const previousStatsRef = useRef(stats);

  useEffect(() => {
    const from = previousStatsRef.current;
    const to = stats;
    const durationMs = 520;
    const start = performance.now();
    let frameId;

    const tick = (now) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        greatMoves: Math.round(from.greatMoves + (to.greatMoves - from.greatMoves) * eased),
        mistakes: Math.round(from.mistakes + (to.mistakes - from.mistakes) * eased),
        blunders: Math.round(from.blunders + (to.blunders - from.blunders) * eased),
      });

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    previousStatsRef.current = stats;

    return () => window.cancelAnimationFrame(frameId);
  }, [stats]);

  const total = Math.max(
    animatedStats.greatMoves + animatedStats.mistakes + animatedStats.blunders,
    1
  );
  const momentum = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((animatedStats.greatMoves * 2 - animatedStats.mistakes - animatedStats.blunders) / total) *
          50 +
          50
      )
    )
  );

  const rows = useMemo(
    () => [
      {
        label: 'Great Moves',
        value: animatedStats.greatMoves,
        icon: '✅',
        valueClass: 'text-emerald-300',
        chipClass: 'border-emerald-500/40 bg-emerald-500/15',
        barClass: 'from-emerald-500 to-emerald-400',
      },
      {
        label: 'Mistakes',
        value: animatedStats.mistakes,
        icon: '⚠️',
        valueClass: 'text-amber-300',
        chipClass: 'border-amber-500/40 bg-amber-500/15',
        barClass: 'from-amber-500 to-amber-300',
      },
      {
        label: 'Blunders',
        value: animatedStats.blunders,
        icon: '❌',
        valueClass: 'text-rose-300',
        chipClass: 'border-rose-500/40 bg-rose-500/15',
        barClass: 'from-rose-500 to-rose-400',
      },
    ],
    [animatedStats.blunders, animatedStats.greatMoves, animatedStats.mistakes]
  );

  return (
    <section className="card-surface group p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Performance
          </h2>
          <p className="mt-1 text-xs text-brand-muted">Session momentum, score, and move quality</p>
        </div>
        <div className="grid gap-2 text-right sm:grid-cols-2">
          <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/50 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-muted">
              Momentum
            </p>
            <p className="text-lg font-bold text-brand-text">{momentum}%</p>
          </div>
          <div className="rounded-xl border border-brand-accent/45 bg-brand-accent/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-muted">
              Score
            </p>
            <p className="text-lg font-bold text-brand-accent">{score}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-brand-elevated/80">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-secondary via-brand-accent to-emerald-400 transition-all duration-500"
          style={{ width: `${momentum}%` }}
        />
      </div>

      <div className="mt-5 space-y-3.5">
        {rows.map((row) => {
          const percentage = Math.round((row.value / total) * 100);

          return (
            <div
              key={row.label}
              className="rounded-xl border border-brand-border/65 bg-brand-elevated/35 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-secondary/60"
            >
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-brand-text">
                  <span className={`rounded-lg border px-2 py-1 text-xs ${row.chipClass}`}>
                    {row.icon}
                  </span>
                  {row.label}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-brand-muted">{percentage}%</span>
                  <span className={`text-base font-bold tabular-nums ${row.valueClass}`}>
                    {row.value}
                  </span>
                </div>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-brand-bg/70">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${row.barClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
        Penalty Points: <span className="font-semibold">{totalPenaltyPoints}</span>
      </div>
    </section>
  );
}

export default PracticePerformanceCard;
