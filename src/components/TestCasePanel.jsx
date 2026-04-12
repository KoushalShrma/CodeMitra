function TestCasePanel({
  testCases,
  activeTestCaseId,
  onSelectTestCase,
  runResult,
  submissionReport,
  isRunning,
  debugExplanation,
  debugError,
  isDebugLoading,
}) {
  const currentTestCase = testCases.find((item) => item.id === activeTestCaseId) ?? testCases[0];
  const isExecutionServiceError = runResult?.errorType === 'Execution Service Error';
  const currentResult = runResult?.results?.find((item) => item.id === currentTestCase?.id);
  const verdictToneClass =
    runResult?.status === 'Great'
      ? 'text-emerald-300'
      : runResult?.status === 'Mistake'
        ? 'text-amber-300'
        : 'text-rose-300';

  return (
    <section className="card-surface flex min-h-[220px] flex-col">
      <div className="border-b border-brand-border/70 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Test Cases
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {testCases.map((testCase) => {
            const status = runResult?.results?.find((item) => item.id === testCase.id)?.status;

            return (
              <button
                key={testCase.id}
                type="button"
                onClick={() => onSelectTestCase(testCase.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  activeTestCaseId === testCase.id
                    ? 'border-brand-secondary bg-brand-elevated text-brand-text shadow-[0_8px_20px_rgba(13,25,58,0.4)]'
                    : 'border-brand-border bg-transparent text-brand-muted hover:-translate-y-0.5 hover:border-brand-secondary/70 hover:text-brand-text'
                }`}
              >
                {testCase.label}
                {status ? (
                  <span
                    className={`ml-2 ${status === 'Pass' ? 'text-emerald-300' : 'text-rose-300'}`}
                  >
                    {status}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5">
        <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Input</p>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-text">
            {currentTestCase.input}
          </pre>
        </div>

        <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Expected Output
          </p>
          <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-text">
            {currentTestCase.expectedOutput}
          </pre>
        </div>

        <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Execution Result
          </p>
          {isRunning ? (
            <div className="mt-3 overflow-hidden rounded-lg border border-brand-border/70 bg-[#050913] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex items-center gap-2 border-b border-brand-border/60 bg-[#0a1124] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 font-mono text-xs text-brand-muted">terminal</span>
              </div>
              <div className="px-3 py-3 font-mono text-sm leading-6 text-brand-secondary">
                <span className="text-brand-muted">$</span> Running code via backend...
              </div>
            </div>
          ) : runResult ? (
            <>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-brand-muted">Verdict:</span>{' '}
                <span className={verdictToneClass}>{runResult.status}</span>
              </p>
              <p className="mt-1.5 text-sm text-brand-text">
                <span className="font-semibold text-brand-muted">Passed:</span>{' '}
                {runResult.passed ?? 0} / {runResult.total ?? testCases.length}
              </p>
              {runResult.errorType ? (
                <p className="mt-1.5 rounded-md border border-rose-500/35 bg-rose-500/10 px-2 py-1.5 text-sm text-rose-300">
                  <span className="font-semibold text-brand-muted">Error:</span>{' '}
                  {runResult.errorType}
                </p>
              ) : null}

              <div className="mt-3 overflow-hidden rounded-lg border border-brand-border/70 bg-[#050913] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-2 border-b border-brand-border/60 bg-[#0a1124] px-3 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 font-mono text-xs text-brand-muted">terminal</span>
                </div>

                <div className="px-3 py-3">
                  <p className="font-mono text-xs text-brand-muted">
                    <span className="text-brand-secondary">$</span> run main
                  </p>
                  <pre
                    className={`mt-2 whitespace-pre-wrap font-mono text-sm leading-6 ${
                      runResult.errorType
                        ? 'text-rose-300'
                        : runResult.status === 'Great'
                          ? 'text-emerald-300'
                          : runResult.status === 'Mistake'
                            ? 'text-amber-300'
                            : 'text-rose-300'
                    }`}
                  >
                    {runResult.output}
                  </pre>
                </div>
              </div>

              {currentResult ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      Actual Output
                    </p>
                    <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-brand-text">
                      {currentResult.actualOutput}
                    </pre>
                  </div>
                  <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      Case Result
                    </p>
                    <p
                      className={`mt-2 text-sm font-semibold ${
                        currentResult.status === 'Pass' ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {currentResult.status}
                    </p>
                  </div>
                </div>
              ) : null}

              {submissionReport ? (
                <div className="mt-3 rounded-lg border border-brand-secondary/35 bg-brand-bg/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    Submission Report
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                        Accuracy
                      </p>
                      <p className="mt-2 text-lg font-semibold text-emerald-300">
                        {submissionReport.accuracy}%
                      </p>
                    </div>
                    <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                        Attempts
                      </p>
                      <p className="mt-2 text-lg font-semibold text-brand-text">
                        {submissionReport.attempts}
                      </p>
                    </div>
                    <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                        Moves
                      </p>
                      <p className="mt-2 text-sm text-brand-text">
                        Great {submissionReport.greatMoves} | Mistake {submissionReport.mistakes} |
                        Blunder {submissionReport.blunders}
                      </p>
                    </div>
                    <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                        Time + Hints
                      </p>
                      <p className="mt-2 text-sm text-brand-text">
                        {submissionReport.totalTimeTakenSeconds}s |{' '}
                        {submissionReport.totalHintsUsed} hints
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="font-semibold text-brand-muted">Final Verdict:</span>{' '}
                    <span className="text-emerald-300">{submissionReport.finalStatus}</span>
                  </p>
                  {submissionReport.errors?.length ? (
                    <div className="mt-3 rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-3.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                        Errors
                      </p>
                      <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-rose-300">
                        {submissionReport.errors.join('\n')}
                      </pre>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!isExecutionServiceError &&
                (runResult.errorType || isDebugLoading || debugExplanation || debugError) && (
                  <div className="mt-3 rounded-lg border border-brand-border/70 bg-brand-bg/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                      AI Debugger
                    </p>

                    {isDebugLoading ? (
                      <p className="mt-2 text-sm text-brand-secondary">
                        Analyzing failure and generating explanation...
                      </p>
                    ) : debugError ? (
                      <p className="mt-2 text-sm text-rose-300">{debugError}</p>
                    ) : debugExplanation ? (
                      <pre className="mt-2 whitespace-pre-wrap rounded-md border border-brand-border/60 bg-[#050913] px-3 py-2 text-sm leading-6 text-brand-text">
                        {debugExplanation}
                      </pre>
                    ) : (
                      <p className="mt-2 text-sm text-brand-muted">
                        Run failed code to see AI-powered debugging guidance.
                      </p>
                    )}
                  </div>
                )}

              {isExecutionServiceError ? (
                <div className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                    Code Execution Failed
                  </p>
                  <p className="mt-2 text-sm leading-6 text-amber-100/90">
                    The backend execution service encountered an error. Make sure:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100/90">
                    <li>Backend server is running (npm start in /backend)</li>
                    <li>Backend is accessible at http://localhost:5000</li>
                    <li>Check backend console for detailed error logs</li>
                  </ul>
                  <p className="mt-2 text-xs text-amber-200/90">Try running your code again.</p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-sm text-brand-muted">
              Run your code to see pass/fail output simulation.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default TestCasePanel;
