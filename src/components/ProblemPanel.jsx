import { useMemo, useState } from 'react';

const difficultyStyles = {
  Easy: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  Medium: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  Hard: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
};

function ProblemPanel({ problem, canViewApproaches = false }) {
  const approaches = useMemo(() => problem?.approaches ?? [], [problem]);
  const [activeApproachId, setActiveApproachId] = useState('');

  const selectedApproachId = useMemo(() => {
    if (!approaches.length) {
      return '';
    }

    if (approaches.some((item) => item.id === activeApproachId)) {
      return activeApproachId;
    }

    return approaches[0].id;
  }, [activeApproachId, approaches]);

  const activeApproach = useMemo(
    () => approaches.find((item) => item.id === selectedApproachId) ?? approaches[0],
    [approaches, selectedApproachId]
  );

  return (
    <aside className="card-surface flex h-full min-h-[360px] flex-col overflow-hidden">
      <div className="border-b border-brand-border/70 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold leading-tight text-brand-text sm:text-xl">
            {problem.title}
          </h2>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold shadow-[0_8px_20px_rgba(0,0,0,0.22)] ${difficultyStyles[problem.difficulty]}`}
          >
            {problem.difficulty}
          </span>
        </div>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-brand-muted">
          Problem Statement
        </p>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-5 py-5 sm:px-6">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Description
          </h3>
          <p className="text-sm leading-7 text-brand-text/90">{problem.description}</p>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Example
          </h3>
          <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-4 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p>
              <span className="font-semibold text-brand-muted">Input:</span> {problem.example.input}
            </p>
            <p className="mt-2">
              <span className="font-semibold text-brand-muted">Output:</span>{' '}
              {problem.example.output}
            </p>
            <p className="mt-2 text-brand-muted">{problem.example.explanation}</p>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Constraints
          </h3>
          <ul className="space-y-2.5 text-sm text-brand-text/90">
            {problem.constraints.map((constraint) => (
              <li
                key={constraint}
                className="rounded-lg border border-brand-border/55 bg-brand-elevated/25 px-3 py-2.5 transition-colors hover:bg-brand-elevated/45"
              >
                {constraint}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Solution Approaches
          </h3>

          {!canViewApproaches ? (
            <div className="rounded-xl border border-brand-border/60 bg-brand-elevated/20 p-4 text-sm text-brand-muted">
              Solve this problem first to unlock Brute Force, Improved, and Optimal approaches.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {approaches.map((approach) => {
                  const isActive = approach.id === selectedApproachId;

                  return (
                    <button
                      key={approach.id}
                      type="button"
                      onClick={() => setActiveApproachId(approach.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        isActive
                          ? 'border-brand-secondary bg-brand-secondary/20 text-brand-text'
                          : 'border-brand-border/60 bg-brand-elevated/20 text-brand-muted hover:border-brand-secondary/55'
                      }`}
                    >
                      {approach.label}
                    </button>
                  );
                })}
              </div>

              {activeApproach ? (
                <div className="rounded-xl border border-brand-border/65 bg-brand-elevated/30 p-4 text-sm text-brand-text/90">
                  <p className="font-semibold text-brand-text">{activeApproach.label}</p>
                  <p className="mt-2 leading-7">{activeApproach.summary}</p>
                  <p className="mt-3 text-brand-muted">When to use: {activeApproach.whenToUse}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-brand-border/70 bg-brand-bg/60 px-2.5 py-1">
                      Time: {activeApproach.timeComplexity}
                    </span>
                    <span className="rounded-full border border-brand-border/70 bg-brand-bg/60 px-2.5 py-1">
                      Space: {activeApproach.spaceComplexity}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Real World Examples
          </h3>
          <ul className="space-y-2.5 text-sm text-brand-text/90">
            {(problem.realWorldExamples || []).map((example) => (
              <li
                key={example}
                className="rounded-lg border border-brand-border/55 bg-brand-elevated/25 px-3 py-2.5"
              >
                {example}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}

export default ProblemPanel;
