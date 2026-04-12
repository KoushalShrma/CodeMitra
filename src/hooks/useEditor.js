import { useEffect, useMemo, useState } from 'react';
import { getPracticeProblemMeta, getPracticeStarterCode } from '../data/practiceProblemMeta';
import { executeCodeViaBackend } from '../services/backendExecutionApi';
import { submitPracticeSolution, trackPracticeRun } from '../services/apiClient';
import { getLoggedInUser } from '../utils/authStorage';
import {
  evaluateOutput,
  generateWrappedCode,
  languageConfig,
  parseOutput,
} from '../utils/codeWrapper';

/**
 * Converts evaluator verdict to user-facing status text.
 * @param {string} status Internal evaluator status.
 * @returns {"Accepted" | "Wrong Answer" | "Runtime Error"} Renderable status.
 */
function mapStatus(status) {
  if (status === 'Great') {
    return 'Accepted';
  }
  if (status === 'Blunder') {
    return 'Runtime Error';
  }
  return 'Wrong Answer';
}

function buildProblemStatement(problem) {
  if (!problem) {
    return '';
  }

  const constraints = Array.isArray(problem.constraints)
    ? problem.constraints.map((item) => `- ${item}`).join('\n')
    : '';
  const example = problem.example
    ? [
        `Input: ${problem.example.input || 'N/A'}`,
        `Output: ${problem.example.output || 'N/A'}`,
        problem.example.explanation ? `Explanation: ${problem.example.explanation}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  return [
    problem.title ? `Title: ${problem.title}` : '',
    problem.description || '',
    example ? `Example:\n${example}` : '',
    constraints ? `Constraints:\n${constraints}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Provides coding workspace state including language, run/submit lifecycle, and focus mode.
 * @param {{ problem: any, testCases: Array<{id: string, input: string, expectedOutput: string}> }} config Editor configuration.
 * @returns {{ languageKey: string, languageLabel: string, languageOptions: Array<{key: string, label: string}>, code: string, setCode: (value: string) => void, setLanguageKey: (value: string) => void, isRunning: boolean, isSubmitting: boolean, runSummary: any, resetCode: () => void, runCode: () => Promise<void>, submitCode: () => Promise<boolean>, focusMode: boolean, toggleFocusMode: () => void, fontSize: number, setFontSize: (value: number) => void, vimMode: boolean, setVimMode: (value: boolean) => void, solveBurstVisible: boolean, clearSolveBurst: () => void }} Editor state API.
 */
export function useEditor({ problem, testCases }) {
  const [languageKey, setLanguageKey] = useState('javascript');
  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [vimMode, setVimMode] = useState(false);
  const [solveBurstVisible, setSolveBurstVisible] = useState(false);
  const [latestCodeReview, setLatestCodeReview] = useState(null);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [runSummary, setRunSummary] = useState({
    status: 'Idle',
    verdict: 'SKIP',
    runtime: '-',
    memory: '-',
    output: 'Run your code to see results.',
    error: '',
    passed: 0,
    total: 0,
    results: [],
  });

  const languageOptions = useMemo(
    () => [
      { key: 'cpp', label: 'C++' },
      { key: 'java', label: 'Java' },
      { key: 'python', label: 'Python' },
      { key: 'javascript', label: 'JavaScript' },
    ],
    []
  );

  const languageLabel = useMemo(
    () => languageConfig[languageKey]?.label || 'JavaScript',
    [languageKey]
  );

  useEffect(() => {
    const nextCode = getPracticeStarterCode(problem?.id || '', languageLabel);
    setCode(nextCode);
    setRunSummary({
      status: 'Idle',
      verdict: 'SKIP',
      runtime: '-',
      memory: '-',
      output: 'Run your code to see results.',
      error: '',
      passed: 0,
      total: 0,
      results: [],
    });
    setSolveBurstVisible(false);
    setLatestCodeReview(null);
    setLastSubmission(null);
  }, [problem?.id, languageLabel]);

  const persistRunSnapshot = async (snapshot, sourceCode) => {
    if (!problem?.id || !snapshot) {
      return;
    }

    const user = getLoggedInUser();
    try {
      await trackPracticeRun({
        userId: user?.id,
        problemId: problem.id,
        language: languageLabel,
        code: sourceCode,
        passed: snapshot.passed || 0,
        total: snapshot.total || (Array.isArray(testCases) ? testCases.length : 0),
        status: snapshot.verdict || 'Blunder',
        error: snapshot.error || null,
        timeTakenSeconds: 0,
        hintsUsed: 0,
      });
    } catch {
      // Best-effort telemetry should not block the editor run loop.
    }
  };

  const runCode = async () => {
    if (!problem || !Array.isArray(testCases) || testCases.length === 0 || isRunning) {
      return null;
    }

    setIsRunning(true);
    setRunSummary((current) => ({
      ...current,
      status: 'Running',
      verdict: 'SKIP',
      error: '',
      output: 'Running...',
    }));

    try {
      const meta = getPracticeProblemMeta(problem.id);
      const wrappedCode = generateWrappedCode(
        code,
        meta.functionName,
        testCases,
        languageKey,
        meta.paramTypes
      );

      const execution = await executeCodeViaBackend({
        displayLanguage: languageLabel,
        sourceCode: wrappedCode,
      });

      if (execution?.errorType) {
        const summary = {
          status: 'Runtime Error',
          verdict: 'Blunder',
          runtime: '-',
          memory: '-',
          output: execution.output || 'Execution failed.',
          error: execution.errorType,
          passed: 0,
          total: testCases.length,
          results: testCases.map((item) => ({
            ...item,
            actualOutput: 'undefined',
            status: 'Fail',
          })),
        };
        setRunSummary(summary);
        await persistRunSnapshot(summary, code);
        return summary;
      }

      const outputs = parseOutput(execution.stdout || execution.output || '');
      const evaluated = evaluateOutput(outputs, testCases);
      const verdict = evaluated.status;
      const mappedStatus = mapStatus(evaluated.status);

      const summary = {
        status: mappedStatus,
        verdict,
        runtime: execution?.time || execution?.runtime || '-',
        memory: execution?.memory || '-',
        output: evaluated.outputs.join('\n') || execution?.output || 'No output.',
        error: mappedStatus === 'Accepted' ? '' : 'One or more test cases failed.',
        passed: evaluated.passed,
        total: evaluated.total,
        results: evaluated.results,
      };

      setRunSummary(summary);
      await persistRunSnapshot(summary, code);
      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Execution failed.';
      const summary = {
        status: 'Runtime Error',
        verdict: 'Blunder',
        runtime: '-',
        memory: '-',
        output: message,
        error: message,
        passed: 0,
        total: testCases.length,
        results: testCases.map((item) => ({
          ...item,
          actualOutput: 'undefined',
          status: 'Fail',
        })),
      };

      setRunSummary(summary);
      await persistRunSnapshot(summary, code);
      return summary;
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    if (isSubmitting) {
      return { accepted: false, submission: null, codeReview: null };
    }

    setIsSubmitting(true);
    try {
      const latestSummary = runSummary.status === 'Idle' ? await runCode() : runSummary;
      const accepted =
        Boolean(latestSummary) &&
        latestSummary.passed > 0 &&
        latestSummary.passed === latestSummary.total;

      if (!accepted) {
        return { accepted: false, submission: null, codeReview: null };
      }

      const user = getLoggedInUser();
      const submission = await submitPracticeSolution({
        userId: user?.id,
        problemId: problem?.id,
        finalCode: code,
        language: languageLabel,
        passed: latestSummary.passed,
        total: latestSummary.total,
        problemStatement: buildProblemStatement(problem),
        timeComplexityClaimed: null,
        topicTags: [problem?.topic, problem?.pattern].filter(Boolean),
      });

      const codeReview = submission?.codeReview || null;
      setLastSubmission(submission || null);
      setLatestCodeReview(codeReview);

      if (accepted) {
        setSolveBurstVisible(true);
      }

      return {
        accepted,
        submission: submission || null,
        codeReview,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit solution.';
      setRunSummary((current) => ({
        ...current,
        status: 'Runtime Error',
        verdict: 'Blunder',
        error: message,
        output: message,
      }));

      return {
        accepted: false,
        submission: null,
        codeReview: null,
        error: message,
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    languageKey,
    languageLabel,
    languageOptions,
    code,
    setCode,
    setLanguageKey,
    isRunning,
    isSubmitting,
    runSummary,
    resetCode() {
      setCode(getPracticeStarterCode(problem?.id || '', languageLabel));
      setRunSummary((current) => ({
        ...current,
        status: 'Idle',
        verdict: 'SKIP',
        output: 'Editor reset.',
        error: '',
      }));
      setLatestCodeReview(null);
      setLastSubmission(null);
    },
    runCode,
    submitCode,
    focusMode,
    toggleFocusMode() {
      setFocusMode((current) => !current);
    },
    fontSize,
    setFontSize,
    vimMode,
    setVimMode,
    solveBurstVisible,
    latestCodeReview,
    lastSubmission,
    clearSolveBurst() {
      setSolveBurstVisible(false);
    },
  };
}
