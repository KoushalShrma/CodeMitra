import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  exportInstitutionTestResultsV2,
  getInstituteTestReport,
  getInstitutionTestResultsV2,
} from '../services/apiClient';
import ScraperCacheStatsWidget from '../components/ScraperCacheStatsWidget';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';
import { getInstitutionSession } from '../utils/institutionSession';

function InstituteAnalyticsPage() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const institutionId = query.get('institutionId') || String(getInstitutionSession()?.institution?.id || '');
  const [testId, setTestId] = useState('');
  const [submittedTestId, setSubmittedTestId] = useState('');
  const [csvExport, setCsvExport] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: report,
    isFetching: isLoading,
    error,
    refetch: refetchReport,
  } = useQuery({
    queryKey: queryKeys.institutionResults(institutionId, submittedTestId),
    queryFn: () =>
      institutionId
        ? getInstitutionTestResultsV2(institutionId, submittedTestId)
        : getInstituteTestReport(submittedTestId),
    enabled: Boolean(submittedTestId),
    staleTime: QUERY_STALE_TIMES.institution,
  });

  const exportMutation = useMutation({
    mutationFn: (targetTestId) => exportInstitutionTestResultsV2(institutionId, targetTestId),
    onSuccess: (csv) => {
      setCsvExport(csv);
      setErrorMessage('');
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to export CSV');
    },
  });

  const queryErrorMessage = error instanceof Error ? error.message : '';

  const handleLoadReport = (event) => {
    event.preventDefault();
    setErrorMessage('');
    setCsvExport('');

    const normalizedId = String(testId || '').trim();
    if (!normalizedId) {
      return;
    }

    if (normalizedId === submittedTestId) {
      void refetchReport();
      return;
    }

    setSubmittedTestId(normalizedId);
  };

  const normalized = useMemo(() => {
    if (!report) {
      return null;
    }

    if (Array.isArray(report.rows)) {
      const rows = report.rows || [];
      const scores = rows.map((row) => Number(row.score || 0));
      const average = scores.length
        ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 100) / 100
        : 0;

      return {
        totalStudents: rows.length,
        averageScore: average,
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,
        leaderboard: rows.map((row) => ({
          userId: row.candidateId,
          name: row.candidateName,
          score: row.score,
          accuracy: row.accuracy,
          timeTaken: row.timeTakenSeconds,
          hintUsage: row.hintUsage,
          tabSwitchCount: row.tabSwitchCount,
        })),
        questionAnalytics: (report.hardestProblems || []).map((item) => ({
          questionId: item.questionId,
          successRate: item.acRate,
          commonMistakes: [`Attempts: ${item.attempts}`],
        })),
        plagiarismFlags: report.plagiarismFlags || [],
        scoreDistribution: report.scoreDistribution || [],
      };
    }

    return {
      ...report,
      plagiarismFlags: report.plagiarismFlags || [],
      scoreDistribution: report.scoreDistribution || [],
    };
  }, [report]);

  const handleExportCsv = async () => {
    if (!institutionId || !submittedTestId) {
      return;
    }

    exportMutation.mutate(submittedTestId);
  };

  return (
    <section className="space-y-8 fade-slide-in">
      <div className="card-surface p-7 sm:p-10">
        <p className="text-sm font-medium text-brand-accent">Institute Analytics</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Test Performance Reports
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-muted">
          Review leaderboard rankings, aggregate scoring trends, and question-wise success rates for
          a test.
        </p>
      </div>

      <ScraperCacheStatsWidget />

      <form onSubmit={handleLoadReport} className="card-surface p-6 sm:p-8">
        <label
          htmlFor="institute-analytics-test-id"
          className="mb-1.5 block text-sm font-medium text-brand-muted"
        >
          Test ID
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="institute-analytics-test-id"
            value={testId}
            onChange={(event) => setTestId(event.target.value)}
            className="form-input max-w-sm"
            placeholder="Enter test ID"
            required
          />
          <button type="submit" disabled={isLoading} className="form-button max-w-fit px-6">
            {isLoading ? 'Loading...' : 'Load Analytics'}
          </button>
          {institutionId ? (
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!submittedTestId || exportMutation.isPending}
              className="rounded-xl border border-brand-border bg-brand-elevated px-5 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-secondary"
            >
              {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
            </button>
          ) : null}
        </div>
        {errorMessage || queryErrorMessage ? (
          <p className="status-error">{errorMessage || queryErrorMessage}</p>
        ) : null}
      </form>

      {normalized ? (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="card-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Total Students
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {normalized.totalStudents}
              </p>
            </div>
            <div className="card-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Average Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {normalized.averageScore}
              </p>
            </div>
            <div className="card-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Highest Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {normalized.highestScore}
              </p>
            </div>
            <div className="card-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Lowest Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {normalized.lowestScore}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Leaderboard
              </p>
              <div className="mt-4 space-y-3">
                {normalized.leaderboard?.map((row, index) => (
                  <div
                    key={`${row.userId}-${index}`}
                    className="rounded-xl border border-brand-border/60 bg-brand-elevated/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-brand-text">
                        #{index + 1} {row.name}
                      </p>
                      <p className="text-sm text-brand-text">
                        Score {row.score} | Accuracy {row.accuracy}% | Time {row.timeTaken}s
                        {row.hintUsage != null ? ` | Hints ${row.hintUsage}` : ''}
                        {row.tabSwitchCount != null ? ` | Tab switches ${row.tabSwitchCount}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Question Analytics
              </p>
              <div className="mt-4 space-y-3">
                {normalized.questionAnalytics?.map((question, index) => (
                  <div
                    key={`${question.questionId}-${index}`}
                    className="rounded-xl border border-brand-border/60 bg-brand-elevated/20 p-4"
                  >
                    <p className="text-sm font-semibold text-brand-text">Question {index + 1}</p>
                    <p className="mt-2 text-sm text-brand-text">
                      Success Rate: {question.successRate}%
                    </p>
                    <p className="mt-2 text-sm text-brand-muted">
                      Common Mistakes:{' '}
                      {question.commonMistakes?.length
                        ? question.commonMistakes.join(', ')
                        : 'None'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {normalized.scoreDistribution?.length ? (
            <div className="card-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Score Distribution
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-5">
                {normalized.scoreDistribution.map((item) => (
                  <div
                    key={item.range}
                    className="rounded-xl border border-brand-border/60 bg-brand-elevated/20 p-4 text-center"
                  >
                    <p className="text-sm font-semibold text-brand-text">{item.range}</p>
                    <p className="mt-2 text-lg font-semibold text-brand-accent">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {normalized.plagiarismFlags?.length ? (
            <div className="card-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Plagiarism Flags
              </p>
              <div className="mt-4 space-y-3">
                {normalized.plagiarismFlags.map((flag, index) => (
                  <div
                    key={`${flag.attemptA}-${flag.attemptB}-${index}`}
                    className="rounded-xl border border-rose-500/35 bg-rose-500/10 p-4"
                  >
                    <p className="text-sm font-semibold text-rose-200">
                      Attempt {flag.attemptA} vs {flag.attemptB} | Similarity {flag.similarity}%
                    </p>
                    <p className="mt-1 text-xs text-rose-100">Question {flag.questionId}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {csvExport ? (
            <div className="card-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                CSV Preview
              </p>
              <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-brand-border/70 bg-brand-elevated/20 p-4 text-xs text-brand-text">
                {csvExport}
              </pre>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export default InstituteAnalyticsPage;
