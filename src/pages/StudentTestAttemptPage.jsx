import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import { executeCodeViaBackend } from '../services/backendExecutionApi';
import {
  getInstitutionTestAttempt,
  getStudentTestAttempt,
  getStudentAttemptReport,
  saveStudentTestSubmission,
  submitInstitutionTest,
  submitStudentTestAttempt,
  trackInstitutionProctoringEvent,
  trackStudentAntiCheat,
} from '../services/apiClient';
import { practiceProblems } from '../data/practiceProblems';
import { getPracticeProblemMeta, getPracticeStarterCode } from '../data/practiceProblemMeta';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';
import {
  evaluateOutput,
  generateWrappedCode,
  languageConfig,
  parseOutput,
} from '../utils/codeWrapper';

const languageTemplates = {
  JavaScript: '',
  Python: '',
  'C++': '',
  Java: '',
};

function getAttemptIdFromSearch(search) {
  const params = new URLSearchParams(search);
  return params.get('attemptId');
}

function formatCountdown(totalSeconds) {
  const safeSeconds = Number.isFinite(totalSeconds)
    ? Math.max(0, Math.floor(totalSeconds))
    : 0;

  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getCustomStarterCode(language) {
  if (language === 'JavaScript') {
    return `function solve(...args) {\n  // TODO: Write logic here\n  return undefined;\n}\n`;
  }
  if (language === 'Python') {
    return `def solve(*args):\n    # TODO: Write logic here\n    return None\n`;
  }
  if (language === 'Java') {
    return `public static Object solve(Object... args) {\n  // TODO: Write logic here\n  return null;\n}\n`;
  }
  if (language === 'C++') {
    return `int solve() {\n  // TODO: Write logic here\n  return 0;\n}\n`;
  }

  return '';
}

function buildQuestionView(question) {
  const practiceProblem = question.problemId
    ? practiceProblems.find((problem) => problem.id === question.problemId)
    : null;

  return {
    ...question,
    title: practiceProblem?.title || `Custom Question ${question.id}`,
    description:
      practiceProblem?.description || question.customQuestion || 'No question prompt provided.',
  };
}

function StudentTestAttemptPage() {
  const { testId, attemptId: attemptIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const attemptId = useMemo(
    () => attemptIdParam || getAttemptIdFromSearch(location.search),
    [attemptIdParam, location.search]
  );
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const institutionId = query.get('institutionId') || '';
  const isInstitutionRoute = location.pathname.startsWith('/institution/');
  const autoSubmitRef = useRef(false);
  const fullscreenArmedRef = useRef(false);
  const fullscreenExitCountRef = useRef(0);
  const timerInitializedRef = useRef(false);

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [runResults, setRunResults] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [antiCheatFlags, setAntiCheatFlags] = useState(0);
  const [result, setResult] = useState(null);
  const [report, setReport] = useState(null);
  const [submissionNotice, setSubmissionNotice] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreenRequired, setIsFullscreenRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const activeQuestion = questions[activeQuestionIndex] || null;
  const activeAnswer = useMemo(() => {
    if (!activeQuestion) {
      return null;
    }

    const existing = answers[activeQuestion.id];
    if (existing) {
      return existing;
    }

    const fallbackLanguage = 'JavaScript';
    return {
      language: fallbackLanguage,
      code: activeQuestion.problemId
        ? getPracticeStarterCode(activeQuestion.problemId, fallbackLanguage)
        : getCustomStarterCode(fallbackLanguage),
    };
  }, [activeQuestion, answers]);

  const {
    data: attemptPayload,
    isLoading: isAttemptLoading,
    error: attemptError,
  } = useQuery({
    queryKey: queryKeys.studentAttempt(attemptId, testId, institutionId),
    queryFn: () =>
      isInstitutionRoute
        ? getInstitutionTestAttempt(testId, attemptId)
        : getStudentTestAttempt(attemptId),
    enabled: Boolean(attemptId && (!isInstitutionRoute || testId)),
    staleTime: QUERY_STALE_TIMES.interactive,
    refetchOnWindowFocus: false,
  });

  const { data: reportPayload, error: reportError } = useQuery({
    queryKey: queryKeys.studentAttemptReport(attemptId),
    queryFn: () => getStudentAttemptReport(attemptId),
    enabled: Boolean(attemptId && !report && (result || attempt?.status === 'completed')),
    staleTime: QUERY_STALE_TIMES.interactive,
  });

  const queryErrorMessage = attemptError instanceof Error ? attemptError.message : '';
  const combinedErrorMessage = errorMessage || queryErrorMessage;
  const isLoading = isAttemptLoading && !attempt;
  const isAttemptLocked = Boolean(attempt && attempt.status && attempt.status !== 'ongoing');

  const trackAntiCheatEvent = async (eventType, eventPayload = {}) => {
    if (testId) {
      await trackInstitutionProctoringEvent(testId, {
        attemptId: Number(attemptId),
        eventType,
        eventPayload,
      });
      return;
    }

    await trackStudentAntiCheat({ attemptId, type: eventType, eventPayload });
  };

  useEffect(() => {
    if (!attemptId || (isInstitutionRoute && !testId)) {
      navigate('/student-tests');
    }
  }, [attemptId, isInstitutionRoute, navigate, testId]);
  useEffect(() => {
    const nextAttempt = attemptPayload?.attempt;
    if (!nextAttempt) {
      return;
    }

    if (attempt?.id === nextAttempt.id && questions.length) {
      return;
    }

    const nextQuestions = (nextAttempt.questions || []).map(buildQuestionView);
    const initialAnswers = {};

    nextQuestions.forEach((question) => {
      const savedLanguage = question.savedSubmission?.language || 'JavaScript';
      initialAnswers[question.id] = {
        language: savedLanguage,
        code:
          question.savedSubmission?.code ||
          (question.problemId
            ? getPracticeStarterCode(question.problemId, savedLanguage)
            : getCustomStarterCode(savedLanguage)),
      };
    });

    setAttempt(nextAttempt);
    setQuestions(nextQuestions);
    setAnswers(initialAnswers);
    setActiveQuestionIndex(0);
    setTabSwitchCount(nextAttempt.tabSwitchCount || 0);
    setAntiCheatFlags(nextAttempt.antiCheatFlags || 0);
    timerInitializedRef.current = false;
    setErrorMessage('');
    if (nextAttempt.status === 'ongoing') {
      setSubmissionNotice('');
    }
  }, [attemptPayload, attempt?.id, questions.length]);

  useEffect(() => {
    timerInitializedRef.current = false;

    if (!attempt?.endTime || result || isSubmitting || isAttemptLocked) {
      setTimeLeft(0);
      return undefined;
    }

    const parsedRemainingSeconds = Number(attempt.remainingSeconds);
    if (Number.isFinite(parsedRemainingSeconds) && parsedRemainingSeconds >= 0) {
      const initialSeconds = Math.max(0, Math.ceil(parsedRemainingSeconds));
      const startedAtMs = Date.now();

      setTimeLeft(initialSeconds);
      timerInitializedRef.current = true;

      const interval = window.setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);
        const nextSeconds = Math.max(0, initialSeconds - elapsedSeconds);
        setTimeLeft(nextSeconds);
      }, 1000);

      return () => window.clearInterval(interval);
    }

    const tick = () => {
      const endTimeMs = new Date(attempt.endTime).getTime();
      if (!Number.isFinite(endTimeMs)) {
        setTimeLeft(0);
        timerInitializedRef.current = false;
        setErrorMessage('Unable to read test timer. Please reload this attempt.');
        return;
      }

      const seconds = Math.max(0, Math.ceil((endTimeMs - Date.now()) / 1000));
      setTimeLeft(seconds);
      timerInitializedRef.current = true;
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [attempt?.id, attempt?.endTime, isAttemptLocked, isSubmitting, result]);

  useEffect(() => {
    if (!attempt || result || isLoading || isSubmitting || isAttemptLocked || autoSubmitRef.current) {
      return;
    }

    if (!timerInitializedRef.current || timeLeft > 0) {
      return;
    }

    autoSubmitRef.current = true;
    void handleSubmitTest(true, 'time_up');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, attempt, isAttemptLocked, isLoading, isSubmitting, result]);

  useEffect(() => {
    if (!attempt || result || isSubmitting || isAttemptLocked) {
      return;
    }

    if (timeLeft > 0) {
      autoSubmitRef.current = false;
    }
  }, [attempt, isAttemptLocked, isSubmitting, result, timeLeft]);

  useEffect(() => {
    if (!reportPayload) {
      return;
    }

    setReport(reportPayload);

    if (!result && attempt?.status === 'completed') {
      setResult({
        totalQuestions: reportPayload.totalQuestions || 0,
        solved: reportPayload.solved || 0,
        accuracy: reportPayload.accuracy || 0,
        score: reportPayload.score || 0,
        status:
          reportPayload.solved === reportPayload.totalQuestions && reportPayload.totalQuestions > 0
            ? 'pass'
            : 'fail',
      });
      setSubmissionNotice((current) => current || 'This test is already submitted.');
    }
  }, [reportPayload]);

  useEffect(() => {
    if (!reportError) {
      return;
    }

    console.error(
      'Failed to load student report:',
      reportError instanceof Error ? reportError.message : String(reportError)
    );
  }, [reportError]);

  useEffect(() => {
    if (!attempt?.antiCheatingEnabled || result) {
      return undefined;
    }

    const handleVisibility = async () => {
      if (document.hidden) {
        setTabSwitchCount((current) => current + 1);
        setAntiCheatFlags((current) => current + 1);
        try {
          await trackAntiCheatEvent('tab_switch', {
            source: 'visibilitychange',
          });
        } catch (error) {
          console.error('Failed to track tab switch:', error.message);
        }
      }
    };

    const handleClipboardEvent = async (event) => {
      event.preventDefault();
      setAntiCheatFlags((current) => current + 1);
      try {
        await trackAntiCheatEvent('clipboard', {
          source: event.type,
        });
      } catch (error) {
        console.error('Failed to track clipboard event:', error.message);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('copy', handleClipboardEvent);
    window.addEventListener('cut', handleClipboardEvent);
    window.addEventListener('paste', handleClipboardEvent);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('copy', handleClipboardEvent);
      window.removeEventListener('cut', handleClipboardEvent);
      window.removeEventListener('paste', handleClipboardEvent);
    };
  }, [attempt, attemptId, result, testId]);

  useEffect(() => {
    if (!attempt?.antiCheatingEnabled || result) {
      setIsFullscreenRequired(false);
      fullscreenArmedRef.current = false;
      fullscreenExitCountRef.current = 0;
      return undefined;
    }

    setIsFullscreenRequired(!Boolean(document.fullscreenElement));
    if (document.fullscreenElement) {
      fullscreenArmedRef.current = true;
    }

    const handleFullscreenChange = async () => {
      if (document.fullscreenElement) {
        fullscreenArmedRef.current = true;
        setIsFullscreenRequired(false);
        setErrorMessage('');
        return;
      }

      setIsFullscreenRequired(true);

      if (!fullscreenArmedRef.current || autoSubmitRef.current || isSubmitting) {
        return;
      }

      fullscreenExitCountRef.current += 1;
      setAntiCheatFlags((current) => current + 1);

      try {
        await trackAntiCheatEvent('fullscreen_exit', {
          source: 'fullscreenchange',
          exitedAt: new Date().toISOString(),
          exitCount: fullscreenExitCountRef.current,
        });
      } catch (error) {
        console.error('Failed to track fullscreen exit:', error.message);
      }

      if (fullscreenExitCountRef.current === 1) {
        setErrorMessage('Fullscreen exited once. Return to fullscreen now. Next exit will auto-submit your test.');
        return;
      }

      setErrorMessage('Fullscreen exited again. Test has been auto-submitted.');
      autoSubmitRef.current = true;
      void handleSubmitTest(true, 'fullscreen_exit');
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [attempt, isSubmitting, result, testId]);

  const handleEnterFullscreen = async () => {
    const root = document.documentElement;

    if (!root.requestFullscreen) {
      setErrorMessage('Fullscreen is not supported in this browser.');
      return;
    }

    try {
      await root.requestFullscreen();
      fullscreenArmedRef.current = true;
      setIsFullscreenRequired(false);
      setErrorMessage('');
    } catch {
      setErrorMessage('Fullscreen is required for this test. Please allow fullscreen and try again.');
    }
  };

  const updateActiveAnswer = (nextValue) => {
    if (!activeQuestion) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [activeQuestion.id]: {
        ...current[activeQuestion.id],
        ...nextValue,
      },
    }));
  };

  const handleLanguageChange = (nextLanguage) => {
    if (!activeQuestion) {
      return;
    }

    updateActiveAnswer({
      language: nextLanguage,
      code: activeQuestion.problemId
        ? getPracticeStarterCode(activeQuestion.problemId, nextLanguage)
        : getCustomStarterCode(nextLanguage),
    });
  };

  const handleCodeChange = (nextCode) => {
    updateActiveAnswer({ code: nextCode });
  };

  const handleLargePaste = () => {
    if (!attempt?.antiCheatingEnabled) {
      return;
    }

    setAntiCheatFlags((current) => current + 1);
    const tracker = trackAntiCheatEvent('clipboard', {
      source: 'large_paste',
    });

    tracker.catch((error) => {
      console.error('Failed to track paste:', error.message);
    });
  };

  const persistQuestionSubmission = async (question, evaluation) => {
    const answer = answers[question.id];

    await saveStudentTestSubmission({
      attemptId,
      questionId: question.id,
      code: answer?.code || '',
      language: answer?.language || 'JavaScript',
      passed: evaluation?.passed || 0,
      total: evaluation?.total || question.testCases.length,
    });
  };

  const handleRunCode = async () => {
    if (!activeQuestion || !activeAnswer) {
      return;
    }

    if (isAttemptLocked) {
      setErrorMessage('This attempt is already submitted.');
      return;
    }

    if (attempt?.antiCheatingEnabled && isFullscreenRequired) {
      setErrorMessage('Enter fullscreen to continue this test.');
      return;
    }

    setIsRunning(true);
    setErrorMessage('');

    try {
      const languageKey =
        Object.keys(languageConfig).find(
          (key) => languageConfig[key].label === activeAnswer.language
        ) || 'javascript';

      const practiceMeta = activeQuestion.problemId
        ? getPracticeProblemMeta(activeQuestion.problemId)
        : { functionName: 'solve', paramTypes: [] };

      const wrappedCode = generateWrappedCode(
        activeAnswer.code,
        practiceMeta.functionName,
        activeQuestion.testCases,
        languageKey,
        practiceMeta.paramTypes
      );

      const execution = await executeCodeViaBackend({
        displayLanguage: languageConfig[languageKey].label,
        sourceCode: wrappedCode,
      });

      let evaluation;

      if (execution.errorType) {
        evaluation = {
          passed: 0,
          total: activeQuestion.testCases.length,
          status: 'Blunder',
          results: activeQuestion.testCases.map((testCase) => ({
            id: testCase.id,
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: 'undefined',
            status: 'Fail',
          })),
          output: execution.output,
          errorType: execution.errorType,
        };
      } else {
        const outputs = parseOutput(execution.stdout || execution.output);
        const judged = evaluateOutput(outputs, activeQuestion.testCases);
        evaluation = {
          ...judged,
          output: judged.outputs.join('\n'),
          errorType: null,
        };
      }

      setRunResults((current) => ({
        ...current,
        [activeQuestion.id]: evaluation,
      }));

      await persistQuestionSubmission(activeQuestion, evaluation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to execute code.';
      const fallbackEvaluation = {
        passed: 0,
        total: activeQuestion.testCases.length,
        status: 'Blunder',
        results: activeQuestion.testCases.map((testCase) => ({
          id: testCase.id,
          input: testCase.input,
          expectedOutput: testCase.expectedOutput,
          actualOutput: 'undefined',
          status: 'Fail',
        })),
        output: message,
        errorType: 'Execution Service Error',
      };

      setRunResults((current) => ({
        ...current,
        [activeQuestion.id]: fallbackEvaluation,
      }));
      await persistQuestionSubmission(activeQuestion, fallbackEvaluation);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitTest = async (isAutoSubmit = false, autoReason = 'manual') => {
    if (!attemptId || isSubmitting) {
      return;
    }

    if (isAttemptLocked) {
      setErrorMessage('This attempt is already submitted.');
      return;
    }

    if (!isAutoSubmit && attempt?.antiCheatingEnabled && isFullscreenRequired) {
      setErrorMessage('Enter fullscreen before submitting this test.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await Promise.all(
        questions.map((question) =>
          saveStudentTestSubmission({
            attemptId,
            questionId: question.id,
            code: answers[question.id]?.code || '',
            language: answers[question.id]?.language || 'JavaScript',
            passed: runResults[question.id]?.passed || 0,
            total: runResults[question.id]?.total || question.testCases.length,
          })
        )
      );

      const submitMode = isAutoSubmit ? autoReason : 'manual';
      const response = isInstitutionRoute
        ? await submitInstitutionTest(testId, attemptId, submitMode)
        : await submitStudentTestAttempt({ attemptId, submitMode });
      setResult(response.result);
      setReport(response.report || null);

      if (isAutoSubmit && autoReason === 'time_up') {
        setSubmissionNotice("Time's up! Your test has been submitted.");
      } else if (isAutoSubmit && autoReason === 'fullscreen_exit') {
        setSubmissionNotice('Fullscreen exited. Your test has been submitted.');
      } else {
        setSubmissionNotice('');
      }
    } catch (error) {
      if (isAutoSubmit && error instanceof Error && error.status === 409) {
        if (autoReason !== 'time_up') {
          autoSubmitRef.current = false;
        }
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : isAutoSubmit
            ? 'Auto-submit failed'
            : 'Unable to submit test'
      );
      autoSubmitRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="card-surface p-6 text-sm text-brand-muted">
        Loading test attempt...
      </section>
    );
  }

  if (queryErrorMessage && !attempt) {
    return (
      <section className="card-surface p-6 text-sm text-brand-muted">
        <p className="status-error">{queryErrorMessage}</p>
      </section>
    );
  }

  if (attempt && questions.length === 0) {
    return (
      <section className="card-surface p-6 text-sm text-brand-muted space-y-4">
        <p className="status-error">
          This test is not ready yet. No questions are assigned to it.
        </p>
        <button
          type="button"
          onClick={() => navigate('/student-tests')}
          className="rounded-xl border border-brand-border bg-brand-elevated px-5 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-secondary"
        >
          Back to Tests
        </button>
      </section>
    );
  }

  if (!attempt || !activeQuestion || !activeAnswer) {
    return (
      <section className="card-surface p-6 text-sm text-brand-muted">
        Test attempt not available.
      </section>
    );
  }

  if (result) {
    return (
      <section className="space-y-8 fade-slide-in">
        <div className="card-surface p-7 sm:p-10">
          {submissionNotice ? (
            <p className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {submissionNotice}
            </p>
          ) : null}
          <p className="text-sm font-medium text-brand-accent">Test Submitted</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{attempt.title}</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Score
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">{result.score}</p>
            </div>
            <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Accuracy
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">{result.accuracy}%</p>
            </div>
            <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Solved
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">
                {result.solved}/{result.totalQuestions}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Status
              </p>
              <p className="mt-2 text-2xl font-semibold text-brand-text">{result.status}</p>
            </div>
          </div>

          {report ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Moves
                </p>
                <p className="mt-2 text-sm text-brand-text">
                  Great {report.greatMoves} | Mistake {report.mistakes} | Blunder {report.blunders}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Time Taken
                </p>
                <p className="mt-2 text-sm text-brand-text">{report.timeTaken}s</p>
              </div>

              <div className="rounded-xl border border-brand-border/70 bg-brand-elevated/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Weak / Strong Areas
                </p>
                <p className="mt-2 text-sm text-brand-text">
                  Weak: {report.weakTopics?.length ? report.weakTopics.join(', ') : 'None'}
                </p>
                <p className="mt-2 text-sm text-brand-text">
                  Strong: {report.strongTopics?.length ? report.strongTopics.join(', ') : 'None'}
                </p>
              </div>
            </div>
          ) : null}

          {report?.questionWise?.length ? (
            <div className="mt-6 rounded-xl border border-brand-border/70 bg-brand-elevated/25 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Question-wise Breakdown
              </p>
              <div className="mt-4 space-y-3">
                {report.questionWise.map((question, index) => (
                  <div
                    key={question.questionId}
                    className="rounded-xl border border-brand-border/60 bg-brand-elevated/20 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-brand-text">Question {index + 1}</p>
                      <p className="text-sm text-brand-text">
                        {question.passed}/{question.total} | {question.status}
                      </p>
                    </div>
                    {question.code ? (
                      <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg border border-brand-border/50 bg-brand-bg/60 p-3 text-xs text-brand-text">
                        {question.code}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (isInstitutionRoute) {
                navigate(`/institution/test/${testId}/lobby`);
                return;
              }
              navigate('/student-tests');
            }}
            className="mt-6 rounded-xl border border-brand-border bg-brand-elevated px-5 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-secondary"
          >
            Back to Tests
          </button>
        </div>
      </section>
    );
  }

  const currentRunResult = runResults[activeQuestion.id];

  return (
    <section className="space-y-4 fade-slide-in">
      <div className="glass-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
            Timed Test
          </p>
          <h1 className="mt-1 text-lg font-semibold text-brand-text sm:text-xl">{attempt.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-brand-border/70 bg-brand-elevated/45 px-4 py-2 text-sm font-semibold text-brand-text">
            Time Left: {formatCountdown(timeLeft)}
          </div>
          <div className="rounded-full border border-brand-border/70 bg-brand-elevated/45 px-4 py-2 text-sm font-semibold text-brand-text">
            Tab Switches: {tabSwitchCount}
          </div>
          <div className="rounded-full border border-brand-border/70 bg-brand-elevated/45 px-4 py-2 text-sm font-semibold text-brand-text">
            Flags: {antiCheatFlags}
          </div>
          <button
            type="button"
            onClick={() => handleSubmitTest(false)}
            disabled={
              isSubmitting
              || isAttemptLocked
              || (attempt.antiCheatingEnabled && isFullscreenRequired)
            }
            className="rounded-xl bg-gradient-to-r from-brand-accent to-brand-accentSoft px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(34,198,163,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      {submissionNotice ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {submissionNotice}
        </p>
      ) : null}

      {attempt.antiCheatingEnabled ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 space-y-3">
          <p>
            Anti-cheating is enabled. Fullscreen is mandatory, and exiting fullscreen will auto-submit your test.
          </p>
          {isFullscreenRequired ? (
            <button
              type="button"
              onClick={handleEnterFullscreen}
              className="rounded-xl border border-amber-300/70 bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/30"
            >
              Enter Fullscreen
            </button>
          ) : (
            <p className="text-xs text-amber-100/90">Fullscreen active.</p>
          )}
        </div>
      ) : null}

      {combinedErrorMessage ? <p className="status-error">{combinedErrorMessage}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="card-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Questions
          </p>
          <div className="mt-4 space-y-2">
            {questions.map((question, index) => {
              const questionRunResult = runResults[question.id];

              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => setActiveQuestionIndex(index)}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    activeQuestionIndex === index
                      ? 'border-brand-secondary bg-brand-elevated text-brand-text'
                      : 'border-brand-border bg-brand-elevated/20 text-brand-muted hover:border-brand-secondary/60 hover:text-brand-text'
                  }`}
                >
                  <p className="text-sm font-semibold">
                    Q{index + 1}. {question.title}
                  </p>
                  <p className="mt-1 text-xs">
                    {question.difficulty} | {question.topic}
                  </p>
                  {questionRunResult ? (
                    <p className="mt-2 text-xs font-semibold text-brand-text">
                      {questionRunResult.passed}/{questionRunResult.total} passed
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="card-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-brand-text">{activeQuestion.title}</h2>
                <p className="mt-3 text-sm leading-7 text-brand-muted">
                  {activeQuestion.description}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-brand-muted">
                <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                  {activeQuestion.difficulty}
                </span>
                <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                  {activeQuestion.topic}
                </span>
                <span className="rounded-full border border-brand-border/70 bg-brand-elevated/40 px-3 py-1">
                  {activeQuestion.pattern}
                </span>
              </div>
            </div>
          </div>

          <div className="card-surface p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {activeQuestion.testCases.map((testCase, index) => (
                <div
                  key={testCase.id}
                  className="rounded-xl border border-brand-border/70 bg-brand-elevated/30 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    Case {index + 1}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-brand-muted">Input</p>
                  <pre className="mt-1 whitespace-pre-wrap text-sm text-brand-text">
                    {testCase.input}
                  </pre>
                  <p className="mt-3 text-xs font-semibold text-brand-muted">Expected Output</p>
                  <pre className="mt-1 whitespace-pre-wrap text-sm text-brand-text">
                    {testCase.expectedOutput}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          <div className="h-[460px] min-h-[420px] sm:h-[520px]">
            <CodeEditor
              language={activeAnswer.language}
              code={activeAnswer.code}
              onCodeChange={handleCodeChange}
              onLanguageChange={handleLanguageChange}
              onRun={handleRunCode}
              onSubmit={() => handleSubmitTest(false)}
              templates={languageTemplates}
              isRunning={isRunning}
              isSubmitting={
                isSubmitting
                || isAttemptLocked
                || (attempt.antiCheatingEnabled && isFullscreenRequired)
              }
              onLargePaste={handleLargePaste}
            />
          </div>

          <div className="card-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Run Result
                </p>
                {currentRunResult ? (
                  <p className="mt-2 text-sm text-brand-text">
                    Passed {currentRunResult.passed}/{currentRunResult.total} | Verdict{' '}
                    {currentRunResult.status}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-brand-muted">
                    Run this question to see evaluation output.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveQuestionIndex((current) => Math.max(current - 1, 0))}
                  disabled={activeQuestionIndex === 0}
                  className="rounded-xl border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveQuestionIndex((current) => Math.min(current + 1, questions.length - 1))
                  }
                  disabled={activeQuestionIndex === questions.length - 1}
                  className="rounded-xl border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-secondary disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Next
                </button>
              </div>
            </div>

            {currentRunResult ? (
              <div className="mt-4 rounded-xl border border-brand-border/70 bg-brand-elevated/30 p-4">
                <pre className="whitespace-pre-wrap text-sm text-brand-text">
                  {currentRunResult.output || currentRunResult.errorType || 'No output'}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default StudentTestAttemptPage;
