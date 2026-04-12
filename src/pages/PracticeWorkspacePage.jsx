import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodeEditor from '../components/CodeEditor';
import ProblemPanel from '../components/ProblemPanel';
import TestCasePanel from '../components/TestCasePanel';
import { executeCodeViaBackend } from '../services/backendExecutionApi';
import { requestErrorExplanationFromGroq, requestHintFromGroq } from '../services/groqApi';
import { logPracticeEvent, submitPracticeSolution, trackPracticeRun } from '../services/apiClient';
import { getLoggedInUser } from '../utils/authStorage';
import { evaluateAntiCheatRisk, LARGE_PASTE_THRESHOLD } from '../utils/antiCheat';
import { practiceProblems, practiceTestCases } from '../data/practiceProblems';
import { getPracticeProblemMeta, getPracticeStarterCode } from '../data/practiceProblemMeta';
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

const HINT_UNLOCK_DELAY_SECONDS = 10 * 60;

const shouldUseDebuggerAssistant = (message) => {
  const normalized = String(message || '').toLowerCase();
  return !(
    normalized.includes('execution service failed') ||
    normalized.includes('unauthorized') ||
    normalized.includes('forbidden')
  );
};

const formatCountdown = (secondsLeft) => {
  const minutes = Math.floor(secondsLeft / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(secondsLeft % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
};

function PracticeWorkspacePage() {
  const { problemId } = useParams();
  const navigate = useNavigate();

  const problemData = useMemo(
    () => practiceProblems.find((problem) => problem.id === problemId) ?? null,
    [problemId]
  );
  const testCasesForProblem = useMemo(
    () => (problemData ? practiceTestCases[problemData.id] || [] : []),
    [problemData]
  );
  const isProblemSelected = Boolean(problemData);
  const problemMeta = useMemo(
    () => (problemData ? getPracticeProblemMeta(problemData.id) : getPracticeProblemMeta('')),
    [problemData]
  );

  const [language, setLanguage] = useState('JavaScript');
  const [code, setCode] = useState(
    problemId
      ? getPracticeStarterCode(problemId, 'JavaScript')
      : getPracticeStarterCode('', 'JavaScript')
  );
  const selectedLanguageKey = useMemo(
    () =>
      Object.keys(languageConfig).find((key) => languageConfig[key].label === language) ||
      'javascript',
    [language]
  );
  const selectedLanguage = languageConfig[selectedLanguageKey];
  const [activeTestCaseId, setActiveTestCaseId] = useState(testCasesForProblem[0]?.id ?? 'tc1');
  const [leftPanelWidth, setLeftPanelWidth] = useState(42);
  const [runResult, setRunResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintText, setHintText] = useState('');
  const [hintError, setHintError] = useState('');
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [debugExplanation, setDebugExplanation] = useState('');
  const [debugError, setDebugError] = useState('');
  const [isDebugLoading, setIsDebugLoading] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [hintUsageCount, setHintUsageCount] = useState(0);
  const [attemptHintCount, setAttemptHintCount] = useState(0);
  const [hintCountdownSeconds, setHintCountdownSeconds] = useState(HINT_UNLOCK_DELAY_SECONDS);
  const [largePasteCount, setLargePasteCount] = useState(0);
  const [attemptStartAt, setAttemptStartAt] = useState(Date.now());
  const [antiCheatWarning, setAntiCheatWarning] = useState('');
  const [activeSection] = useState('editor');
  const [hasSolvedProblem, setHasSolvedProblem] = useState(false);
  const [submissionReport, setSubmissionReport] = useState(null);
  const [celebrationState, setCelebrationState] = useState(null);
  const [isHorizontalResizing, setIsHorizontalResizing] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const onResize = () => {
      setIsDesktopLayout(window.innerWidth >= 1024);
    };

    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    setLanguage('JavaScript');
    setCode(getPracticeStarterCode(problemId, 'JavaScript'));
    setRunResult(null);
    setDebugExplanation('');
    setDebugError('');
    setHintText('');
    setHintError('');
    setHintLevel(0);
    setHintUsageCount(0);
    setAttemptHintCount(0);
    setHintCountdownSeconds(HINT_UNLOCK_DELAY_SECONDS);
    setAttemptStartAt(Date.now());
    setHasSolvedProblem(false);
    setSubmissionReport(null);
    setCelebrationState(null);
    setAntiCheatWarning('');
  }, [problemId]);

  useEffect(() => {
    if (!celebrationState?.redirectTo) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      navigate(celebrationState.redirectTo);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [celebrationState, navigate]);

  useEffect(() => {
    if (!testCasesForProblem.length) {
      setActiveTestCaseId('tc1');
      return;
    }

    if (!testCasesForProblem.some((testCase) => testCase.id === activeTestCaseId)) {
      setActiveTestCaseId(testCasesForProblem[0].id);
    }
  }, [testCasesForProblem, activeTestCaseId]);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    setCode(getPracticeStarterCode(problemId, nextLanguage));
    setHintText('');
    setHintError('');
    setHintLevel(0);
    setHintUsageCount(0);
    setAttemptHintCount(0);
    setLargePasteCount(0);
    setAttemptStartAt(Date.now());
    setAntiCheatWarning('');
    setSubmissionReport(null);
  };

  const handleCodeChange = (nextCode) => {
    setCode(nextCode);
  };

  const handleLargePaste = ({ pastedLength, preview }) => {
    setLargePasteCount((current) => current + 1);
    setAntiCheatWarning(
      'Large pasted code detected. Write and explain your approach to avoid penalties.'
    );

    const user = getLoggedInUser();
    if (!user?.id) {
      return;
    }

    logPracticeEvent({
      user_id: user.id,
      event_type: 'large_paste',
      details: `length=${pastedLength}; preview=${preview.replace(/\s+/g, ' ').slice(0, 120)}`,
    }).catch((error) => {
      console.error('Failed to log large paste event:', error.message);
    });
  };

  useEffect(() => {
    const tick = () => {
      const elapsedSeconds = Math.floor((Date.now() - attemptStartAt) / 1000);
      const nextCountdown = Math.max(HINT_UNLOCK_DELAY_SECONDS - elapsedSeconds, 0);
      setHintCountdownSeconds(nextCountdown);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [attemptStartAt]);

  const isTimedHintUnlocked = hintCountdownSeconds <= 0;

  const fetchDebuggerExplanation = async (executionErrorMessage) => {
    setIsDebugLoading(true);
    setDebugError('');

    try {
      const explanation = await requestErrorExplanationFromGroq({
        userCode: code,
        errorMessage: executionErrorMessage,
        problemDescription: `${problemData.title}\n\n${problemData.description}\n\nExample:\nInput: ${problemData.example.input}\nOutput: ${problemData.example.output}\n\nConstraints:\n- ${problemData.constraints.join('\n- ')}`,
        language,
      });

      setDebugExplanation(explanation);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to generate debug explanation.';
      setDebugError(message);
    } finally {
      setIsDebugLoading(false);
    }
  };

  const persistRun = async ({ passed, total, status, error }) => {
    const user = getLoggedInUser();
    const resetAttemptTracking = () => {
      setAttemptStartAt(Date.now());
      setAttemptHintCount(0);
    };

    if (!user?.id || !problemData) {
      resetAttemptTracking();
      return;
    }

    const timeTakenSeconds = Math.max(1, Math.round((Date.now() - attemptStartAt) / 1000));

    try {
      await trackPracticeRun({
        userId: user.id,
        problemId: problemData.id,
        language,
        code,
        passed,
        total,
        status,
        error: error || null,
        timeTakenSeconds,
        hintsUsed: attemptHintCount,
      });

      resetAttemptTracking();
    } catch (error) {
      console.error('Failed to track run:', error.message);
      resetAttemptTracking();
    }
  };

  const handleRun = async () => {
    if (!problemData || !testCasesForProblem.length) {
      return;
    }

    setIsRunning(true);
    setAntiCheatWarning('');
    setDebugExplanation('');
    setDebugError('');
    setIsDebugLoading(false);
    setRunResult({
      status: 'Running',
      output: 'Running...',
      errorType: null,
      passed: 0,
      total: testCasesForProblem.length,
      results: [],
    });

    try {
      const wrappedCodeWithLanguage = generateWrappedCode(
        code,
        problemMeta.functionName,
        testCasesForProblem,
        selectedLanguageKey,
        problemMeta.paramTypes
      );
      const execution = await executeCodeViaBackend({
        displayLanguage: selectedLanguage.label,
        sourceCode: wrappedCodeWithLanguage,
      });

      if (execution.errorType) {
        const failedRunResult = {
          status: 'Blunder',
          output: execution.output,
          errorType: execution.errorType,
          passed: 0,
          total: testCasesForProblem.length,
          results: testCasesForProblem.map((item) => ({
            id: item.id,
            label: item.label,
            input: item.input,
            expectedOutput: item.expectedOutput,
            actualOutput: 'undefined',
            status: 'Fail',
          })),
        };

        setRunResult(failedRunResult);
        await persistRun({
          passed: 0,
          total: testCasesForProblem.length,
          status: 'Blunder',
          error: execution.errorType,
        });

        fetchDebuggerExplanation(execution.output || execution.errorType);
        return;
      }

      const outputs = parseOutput(execution.stdout || execution.output);
      const evaluation = evaluateOutput(outputs, testCasesForProblem);

      const nextRunResult = {
        status: evaluation.status,
        output: evaluation.outputs.join('\n'),
        errorType: null,
        passed: evaluation.passed,
        total: evaluation.total,
        results: evaluation.results,
      };

      setRunResult(nextRunResult);
      await persistRun({
        passed: evaluation.passed,
        total: evaluation.total,
        status: evaluation.status,
        error: null,
      });

      if (evaluation.passed !== evaluation.total) {
        const firstFailedCase = evaluation.results.find((result) => result.status === 'Fail');
        const actualOutput = firstFailedCase?.actualOutput || 'undefined';
        const expectedOutput = firstFailedCase?.expectedOutput || '(no expected output)';
        fetchDebuggerExplanation(
          `Wrong output. Expected: ${expectedOutput}. Got: ${actualOutput}. Explain likely logic mistake and how to fix it.`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to execute code.';

      const failedRunResult = {
        status: 'Blunder',
        output: message,
        errorType: 'Execution Service Error',
        passed: 0,
        total: testCasesForProblem.length,
        results: testCasesForProblem.map((item) => ({
          id: item.id,
          label: item.label,
          input: item.input,
          expectedOutput: item.expectedOutput,
          actualOutput: 'undefined',
          status: 'Fail',
        })),
      };

      setRunResult(failedRunResult);
      await persistRun({
        passed: 0,
        total: testCasesForProblem.length,
        status: 'Blunder',
        error: message,
      });

      if (shouldUseDebuggerAssistant(message)) {
        fetchDebuggerExplanation(message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!problemData || !testCasesForProblem.length) {
      return;
    }

    setIsSubmitting(true);

    const timeTakenSeconds = Math.round((Date.now() - attemptStartAt) / 1000);
    const antiCheat = evaluateAntiCheatRisk({
      largePasteCount,
      hintsUsed: hintUsageCount,
      timeTakenSeconds,
    });

    if (antiCheat.suspicious) {
      setAntiCheatWarning('Try solving on your own for better learning');
    } else {
      setAntiCheatWarning('');
    }

    const passedAllCases = runResult?.passed === runResult?.total && runResult?.total > 0;
    const user = getLoggedInUser();

    if (!passedAllCases) {
      setRunResult((current) =>
        current
          ? {
              ...current,
              errorType: current.errorType || 'Run and pass all test cases before submitting.',
            }
          : current
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const submission = await submitPracticeSolution({
        userId: user?.id,
        problemId: problemData.id,
        language,
        finalCode: code,
        passed: runResult.passed,
        total: runResult.total,
      });

      setHasSolvedProblem(true);
      setSubmissionReport(submission.report || null);
      setCelebrationState({
        title: submission.alreadyCompleted ? 'Encore Unlocked' : 'Quest Cleared',
        message:
          submission.message ||
          'Outstanding work. Your solution is now part of your growing streak of wins.',
        redirectTo: submission.redirectTo || '/progress',
      });
      setRunResult((current) =>
        current
          ? {
              ...current,
              errorType: null,
            }
          : current
      );
      setAttemptStartAt(Date.now());
      setLargePasteCount(0);
      setHintUsageCount(0);
      setAttemptHintCount(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit solution.';
      setRunResult((current) =>
        current
          ? {
              ...current,
              errorType: message,
            }
          : current
      );
    } finally {
      setTimeout(() => setIsSubmitting(false), 450);
    }
  };

  const handleGetHint = async ({ manualTrigger = false } = {}) => {
    if (!problemData) {
      setHintError('Select a valid problem to request hints.');
      return;
    }

    if (!manualTrigger && !isTimedHintUnlocked) {
      setHintError(
        `Hint unlocks in ${formatCountdown(hintCountdownSeconds)}. You can still request an early mentor hint.`
      );
      return;
    }

    setIsHintLoading(true);
    setHintError('');

    const nextHintLevel = Math.min(hintLevel + 1, 3);

    try {
      const hint = await requestHintFromGroq({
        problemTitle: problemData.title,
        problemDescription: `${problemData.description}\n\nExample:\nInput: ${problemData.example.input}\nOutput: ${problemData.example.output}\n\nConstraints:\n- ${problemData.constraints.join('\n- ')}`,
        userCode: code,
        language,
        hintLevel: nextHintLevel,
        previousHint: hintText,
      });

      setHintText(hint);
      setHintLevel(nextHintLevel);
      setHintUsageCount((current) => current + 1);
      setAttemptHintCount((current) => current + 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate hint right now.';
      setHintError(message);
    } finally {
      setIsHintLoading(false);
    }
  };

  const startHorizontalResize = (event) => {
    if (!isDesktopLayout) {
      return;
    }

    event.preventDefault();
    setIsHorizontalResizing(true);

    const onMove = (moveEvent) => {
      const nextWidth = (moveEvent.clientX / window.innerWidth) * 100;
      setLeftPanelWidth(Math.min(65, Math.max(28, nextWidth)));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setIsHorizontalResizing(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!problemData) {
    return (
      <section className="fade-slide-in flex min-h-[calc(100vh-8.5rem)] flex-col items-center justify-center gap-4">
        <div className="rounded-xl border border-brand-border/75 bg-brand-elevated/40 px-5 py-5 text-center text-sm text-brand-muted">
          Problem not found. Please choose a valid problem from the list.
        </div>
        <button
          type="button"
          onClick={() => navigate('/problems')}
          className="rounded-lg border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-secondary"
        >
          Back to Problems
        </button>
      </section>
    );
  }

  return (
    <section className="fade-slide-in flex min-h-[calc(100vh-8.5rem)] flex-col gap-3">
      {celebrationState ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#040813]/78 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-brand-accent/35 bg-gradient-to-br from-brand-surface/95 via-brand-bg to-brand-elevated/95 p-8 text-center shadow-[0_30px_80px_rgba(4,12,28,0.65)]">
            <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-accent/30 to-brand-secondary/30 text-4xl text-brand-accent shadow-[0_18px_45px_rgba(34,198,163,0.28)]">
              {celebrationState.title === 'Encore Unlocked' ? '\u2728' : '\uD83C\uDFC6'}
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-brand-muted">
              Submission Complete
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-brand-text">
              {celebrationState.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-brand-muted">{celebrationState.message}</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-secondary">
              Redirecting to your progress dashboard...
            </p>
          </div>
        </div>
      ) : null}

      <header className="glass-panel flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
            Practice Workspace
          </p>
          <h1 className="mt-1 text-lg font-semibold text-brand-text sm:text-xl">
            {problemData.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/problems')}
            className="rounded-lg border border-brand-border bg-brand-elevated px-3 py-2 text-xs font-semibold text-brand-text transition hover:border-brand-secondary"
          >
            Back to Problems
          </button>
          <div className="rounded-full border border-brand-border/70 bg-brand-elevated/45 px-3 py-1 text-xs font-medium text-brand-muted">
            {language} Mode
          </div>
          <button
            type="button"
            onClick={() => handleGetHint()}
            disabled={isHintLoading || !isTimedHintUnlocked || !isProblemSelected}
            className="rounded-lg border border-brand-secondary/60 bg-brand-elevated px-3 py-2 text-xs font-semibold text-brand-text transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-secondary hover:bg-brand-elevated/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isHintLoading
              ? 'Thinking...'
              : isTimedHintUnlocked
                ? hintLevel > 0
                  ? 'Deeper Hint'
                  : 'Get Hint'
                : `Hint in ${formatCountdown(hintCountdownSeconds)}`}
          </button>
          <button
            type="button"
            onClick={() => handleGetHint({ manualTrigger: true })}
            disabled={isHintLoading || !isProblemSelected}
            className="rounded-lg border border-amber-400/55 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isHintLoading ? 'Thinking...' : 'Need Help Now'}
          </button>
        </div>
      </header>

      {(isHintLoading || hintText || hintError) && (
        <section className="card-surface border-brand-secondary/45 bg-gradient-to-r from-brand-elevated/65 to-brand-surface/80 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-muted">
              Mentor Hint
            </h2>
            {hintText && !isHintLoading ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-brand-border/70 bg-brand-elevated/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                  Level {Math.max(hintLevel, 1)}
                </span>
                <button
                  type="button"
                  onClick={() => handleGetHint({ manualTrigger: true })}
                  className="rounded-lg border border-brand-border bg-brand-elevated px-3 py-1.5 text-xs font-semibold text-brand-text transition hover:border-brand-secondary"
                >
                  Request Deeper Hint
                </button>
              </div>
            ) : null}
          </div>

          {isHintLoading ? (
            <p className="text-sm text-brand-secondary">Thinking through your approach...</p>
          ) : hintError ? (
            <p className="text-sm text-rose-300">{hintError}</p>
          ) : (
            <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-brand-border/70 bg-brand-bg/75 px-3 py-3 text-sm leading-7 text-brand-text">
              {hintText}
            </pre>
          )}
        </section>
      )}

      {antiCheatWarning ? (
        <div className="rounded-xl border border-amber-500/45 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {antiCheatWarning}
        </div>
      ) : null}

      <div
        className={`grid min-h-0 flex-1 gap-3 ${isDesktopLayout ? 'grid-rows-[1fr_auto]' : 'grid-rows-none'}`}
      >
        <div className={`flex min-h-0 gap-3 ${isDesktopLayout ? 'flex-row' : 'flex-col'}`}>
          <div
            className={`workspace-panel ${isDesktopLayout ? 'min-w-[300px]' : 'w-full min-w-0'} ${
              isHorizontalResizing ? '' : 'transition-[width] duration-300 ease-out'
            }`}
            data-active={activeSection === 'problem'}
            style={isDesktopLayout ? { width: `${leftPanelWidth}%` } : undefined}
          >
            <ProblemPanel problem={problemData} canViewApproaches={hasSolvedProblem} />
          </div>

          {isDesktopLayout ? (
            <button
              type="button"
              aria-label="Resize panels"
              onMouseDown={startHorizontalResize}
              className="group w-2 shrink-0 cursor-col-resize rounded-full bg-brand-border/55 transition hover:bg-brand-secondary"
            >
              <span className="block h-full w-full rounded-full opacity-0 group-hover:opacity-100" />
            </button>
          ) : null}

          <div
            className={`workspace-panel flex-1 ${isDesktopLayout ? 'min-w-[320px]' : 'w-full min-w-0'}`}
            data-active={activeSection === 'editor'}
          >
            <CodeEditor
              language={language}
              code={code}
              onCodeChange={handleCodeChange}
              onLargePaste={handleLargePaste}
              onLanguageChange={handleLanguageChange}
              onRun={handleRun}
              onSubmit={handleSubmit}
              templates={languageTemplates}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              largePasteThreshold={LARGE_PASTE_THRESHOLD}
            />
          </div>
        </div>

        <div className="workspace-panel min-h-[220px]" data-active={activeSection === 'tests'}>
          <TestCasePanel
            testCases={testCasesForProblem}
            activeTestCaseId={activeTestCaseId}
            onSelectTestCase={setActiveTestCaseId}
            runResult={runResult}
            submissionReport={submissionReport}
            isRunning={isRunning}
            debugExplanation={debugExplanation}
            debugError={debugError}
            isDebugLoading={isDebugLoading}
          />
        </div>
      </div>
    </section>
  );
}

export default PracticeWorkspacePage;
