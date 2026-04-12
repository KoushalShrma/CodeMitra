import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getActiveStudentTests,
  joinStudentTestByCode,
  startStudentTestAttempt,
} from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function StudentTestsPage() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.studentTestsActive,
    queryFn: getActiveStudentTests,
    staleTime: QUERY_STALE_TIMES.interactive,
    refetchInterval: 10000,
  });

  const startTestMutation = useMutation({
    mutationFn: (testId) => startStudentTestAttempt({ testId }),
    onSuccess: (response, testId) => {
      navigate(`/test/${testId}?attemptId=${response.attempt.id}`);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to start test');
    },
  });

  const joinByCodeMutation = useMutation({
    mutationFn: (code) =>
      joinStudentTestByCode({
        joinCode: code,
      }),
    onSuccess: (response) => {
      const attempt = response?.attempt;
      if (!attempt?.id || !attempt?.testId) {
        setErrorMessage('Unable to resolve test attempt from join code');
        return;
      }
      navigate(`/test/${attempt.testId}?attemptId=${attempt.id}`);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to join by code');
    },
  });

  const tests = data?.tests || [];
  const startingTestId = startTestMutation.isPending ? startTestMutation.variables : null;
  const queryErrorMessage = error instanceof Error ? error.message : '';

  const handleStartTest = async (testId) => {
    setErrorMessage('');
    startTestMutation.mutate(testId);
  };

  const handleJoinByCode = async (event) => {
    event.preventDefault();
    const normalizedCode = joinCode.trim();
    if (!normalizedCode) {
      setErrorMessage('Enter a join code');
      return;
    }

    setErrorMessage('');
    joinByCodeMutation.mutate(normalizedCode);
  };

  return (
    <section className="space-y-8 fade-slide-in">
      <div className="card-surface p-7 sm:p-10">
        <p className="text-sm font-medium text-brand-accent">Student Test Center</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Available Coding Tests
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-muted">
          Start any currently active test, solve the assigned coding questions, and submit before
          the timer ends.
        </p>

        <form onSubmit={handleJoinByCode} className="mt-6 flex flex-wrap gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="Enter test join code"
            className="form-input max-w-xs"
          />
          <button
            type="submit"
            disabled={joinByCodeMutation.isPending}
            className="rounded-xl border border-brand-border bg-brand-elevated px-5 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {joinByCodeMutation.isPending ? 'Joining...' : 'Join With Code'}
          </button>
        </form>
      </div>

      {errorMessage || queryErrorMessage ? (
        <p className="status-error">{errorMessage || queryErrorMessage}</p>
      ) : null}

      {isLoading ? (
        <div className="card-surface p-6 text-sm text-brand-muted">Loading active tests...</div>
      ) : tests.length === 0 ? (
        <div className="card-surface p-6 text-sm text-brand-muted">
          No active tests are available right now.
        </div>
      ) : (
        <div className="grid gap-5">
          {tests.map((test) => (
            <div key={test.id} className="card-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-brand-text">{test.title}</h2>
                  <p className="text-sm leading-6 text-brand-muted">
                    {test.description || 'No description provided.'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-brand-muted">
                    <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                      Duration: {test.duration} mins
                    </span>
                    <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                      Starts: {formatDateTime(test.startTime)}
                    </span>
                    <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                      Ends: {formatDateTime(test.endTime)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartTest(test.id)}
                  disabled={startingTestId === test.id}
                  className="rounded-xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(34,198,163,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {startingTestId === test.id ? 'Starting...' : 'Start Test'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default StudentTestsPage;
