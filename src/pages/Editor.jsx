import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  LoaderCircle,
  ListTodo,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AiChat } from '../components/ai/AiChat';
import { CodeEditorPanel } from '../components/editor/CodeEditorPanel';
import { ExecutionResultPanel } from '../components/editor/ExecutionResultPanel';
import { ProblemStatementPanel } from '../components/editor/ProblemStatementPanel';
import { TestCasePanel } from '../components/editor/TestCasePanel';
import { SplitPane } from '../components/layout/SplitPane';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { practiceProblems, practiceTestCases } from '../data/practiceProblems';
import { useDebouncedPreferenceSave } from '../hooks/useDebouncedPreferenceSave';
import { useEditor } from '../hooks/useEditor';
import { getAiHintStatus, requestAiHintStream, requestAiReviewStream } from '../services/apiClient';
import { QUERY_STALE_TIMES, queryKeys } from '../services/queryConfig';

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function canCaptureShortcut(event) {
  const element = event.target;
  if (!(element instanceof HTMLElement)) {
    return true;
  }

  const tagName = element.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return false;
  }

  if (element.isContentEditable) {
    return false;
  }

  return true;
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

function parseHintError(error) {
  if (error && typeof error === 'object') {
    const payload = error.payload || {};
    const rawSeconds = payload.secondsRemaining ?? payload.seconds_remaining ?? payload.seconds;
    const rawHints = payload.remainingHints ?? payload.hints_remaining ?? payload.hintsRemaining;
    const parsedSeconds = rawSeconds == null ? null : Number(rawSeconds);
    const parsedHints = rawHints == null ? null : Number(rawHints);

    return {
      message: error.message || payload.message || 'Unable to fetch hint right now.',
      secondsRemaining: Number.isFinite(parsedSeconds) ? parsedSeconds : null,
      hintsRemaining: Number.isFinite(parsedHints) ? parsedHints : null,
    };
  }

  return {
    message: 'Unable to fetch hint right now.',
    secondsRemaining: null,
    hintsRemaining: null,
  };
}

/**
 * Premium coding editor page with split problem view, Monaco workspace, test diagnostics, and AI assistant.
 * @returns {JSX.Element} Editor page.
 */
function Editor() {
  const navigate = useNavigate();
  const { problemId } = useParams();
  const { user } = useAuth();
  const { queuePreferencePatch } = useDebouncedPreferenceSave();
  const hasHydratedEditorPreferencesRef = useRef(false);
  const [activeTab, setActiveTab] = useState('output');
  const [aiVisible, setAiVisible] = useState(false);
  const [queuedAiPrompt, setQueuedAiPrompt] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [notes, setNotes] = useState('');
  const [hintState, setHintState] = useState(null);
  const [hintError, setHintError] = useState('');
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [latestHint, setLatestHint] = useState('');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewPayload, setReviewPayload] = useState(null);
  const [reviewStreamingPreview, setReviewStreamingPreview] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const selectedProblem = useMemo(() => {
    if (!problemId) {
      return practiceProblems[0] || null;
    }

    return practiceProblems.find((item) => item.id === problemId) || null;
  }, [problemId]);

  const fallbackProblem = practiceProblems[0] || null;
  const activeProblem = selectedProblem || fallbackProblem;
  const testCases = useMemo(
    () => (activeProblem ? practiceTestCases[activeProblem.id] || [] : []),
    [activeProblem]
  );

  const {
    languageKey,
    languageLabel,
    languageOptions,
    code,
    setCode,
    setLanguageKey,
    isRunning,
    isSubmitting,
    runSummary,
    resetCode,
    runCode,
    submitCode,
    focusMode,
    toggleFocusMode,
    fontSize,
    setFontSize,
    vimMode,
    setVimMode,
    solveBurstVisible,
    latestCodeReview,
    lastSubmission,
    clearSolveBurst,
  } = useEditor({
    problem: activeProblem,
    testCases,
  });

  useEffect(() => {
    hasHydratedEditorPreferencesRef.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || hasHydratedEditorPreferencesRef.current) {
      return;
    }

    const preferences = user.preferences || {};
    const preferredLanguage = String(preferences.preferred_language || '').toLowerCase();
    if (preferredLanguage && languageOptions.some((item) => item.key === preferredLanguage)) {
      setLanguageKey(preferredLanguage);
    }

    const preferredFontSize = Number(preferences.editor_font_size);
    if (Number.isFinite(preferredFontSize)) {
      setFontSize(Math.min(22, Math.max(12, Math.round(preferredFontSize))));
    }

    if (typeof preferences.vim_mode === 'boolean') {
      setVimMode(preferences.vim_mode);
    }

    hasHydratedEditorPreferencesRef.current = true;
  }, [languageOptions, setFontSize, setLanguageKey, setVimMode, user?.id, user?.preferences]);

  useEffect(() => {
    if (!user?.id || !hasHydratedEditorPreferencesRef.current) {
      return;
    }

    if (Number(user?.preferences?.editor_font_size) === Number(fontSize)) {
      return;
    }

    queuePreferencePatch({ editor_font_size: fontSize });
  }, [fontSize, queuePreferencePatch, user?.id, user?.preferences?.editor_font_size]);

  useEffect(() => {
    if (!user?.id || !hasHydratedEditorPreferencesRef.current) {
      return;
    }

    if (String(user?.preferences?.preferred_language || '').toLowerCase() === languageKey) {
      return;
    }

    queuePreferencePatch({ preferred_language: languageKey });
  }, [languageKey, queuePreferencePatch, user?.id, user?.preferences?.preferred_language]);

  useEffect(() => {
    if (!user?.id || !hasHydratedEditorPreferencesRef.current) {
      return;
    }

    if (Boolean(user?.preferences?.vim_mode) === Boolean(vimMode)) {
      return;
    }

    queuePreferencePatch({ vim_mode: vimMode });
  }, [queuePreferencePatch, user?.id, user?.preferences?.vim_mode, vimMode]);

  useEffect(() => {
    if (!problemId && fallbackProblem) {
      navigate(`/editor/${fallbackProblem.id}`, { replace: true });
      return;
    }

    if (problemId && !selectedProblem && fallbackProblem) {
      navigate(`/editor/${fallbackProblem.id}`, { replace: true });
    }
  }, [problemId, selectedProblem, fallbackProblem, navigate]);

  useEffect(() => {
    setElapsedSeconds(0);
    setActiveTab('output');
    setAiVisible(false);
    setHintState(null);
    setHintError('');
    setLatestHint('');
    setReviewModalOpen(false);
    setReviewPayload(null);
    setReviewStreamingPreview('');
    setReviewError('');

    if (!activeProblem) {
      setNotes('');
      return;
    }

    const notesKey = `editor-notes-${activeProblem.id}`;
    const stored = window.localStorage.getItem(notesKey);
    setNotes(stored || '');
  }, [activeProblem]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeProblem) {
      return;
    }

    const notesKey = `editor-notes-${activeProblem.id}`;
    window.localStorage.setItem(notesKey, notes);
  }, [activeProblem, notes]);

  const activeProblemTitle = activeProblem?.title || 'Selected Problem';
  const difficultyTimeBudget =
    activeProblem?.difficulty === 'Hard'
      ? 60 * 45
      : activeProblem?.difficulty === 'Medium'
        ? 60 * 35
        : 60 * 25;
  const remainingSeconds = Math.max(difficultyTimeBudget - elapsedSeconds, 0);
  const aiContext = {
    title: activeProblem?.title,
    description: activeProblem?.description,
    starterCode: code,
    language: languageLabel,
  };

  const applyHintPayload = useCallback((payload) => {
    if (!payload) {
      return;
    }

    setHintState({
      allowHints: Boolean(payload.allowHints),
      cooldownMinutes: Number(payload.cooldownMinutes || 0),
      secondsRemaining: Math.max(Number(payload.secondsRemaining || 0), 0),
      maxHints: Number(payload.maxHints || 0),
      usedHints: Number(payload.usedHints || 0),
      remainingHints: Number(payload.remainingHints || 0),
      hintHistory: Array.isArray(payload.hintHistory) ? payload.hintHistory : [],
    });

    if (typeof payload.hint === 'string' && payload.hint.trim()) {
      setLatestHint(payload.hint.trim());
    }
  }, []);

  const {
    data: hintStatusPayload,
    error: hintStatusError,
    refetch: refetchHintStatus,
  } = useQuery({
    queryKey: queryKeys.hintStatus(activeProblem?.id, null),
    queryFn: () => getAiHintStatus(activeProblem.id),
    enabled: Boolean(activeProblem?.id),
    staleTime: QUERY_STALE_TIMES.interactive,
  });

  useEffect(() => {
    if (!hintStatusPayload) {
      return;
    }

    setHintError('');
    applyHintPayload(hintStatusPayload);
  }, [hintStatusPayload, applyHintPayload]);

  useEffect(() => {
    if (!hintStatusError) {
      return;
    }

    const parsed = parseHintError(hintStatusError);
    setHintError(parsed.message);
  }, [hintStatusError]);

  const handleRequestHint = useCallback(async () => {
    if (!activeProblem?.id) {
      return;
    }

    setIsHintLoading(true);
    setHintError('');
    setLatestHint('');
    setActiveTab('hint');
    let streamedHint = '';
    let streamIssue = null;

    try {
      await requestAiHintStream(
        {
          problemId: activeProblem.id,
          problemStatement: buildProblemStatement(activeProblem),
          userCode: code,
          topicTags: [activeProblem.topic, activeProblem.pattern].filter(Boolean),
          testId: null,
          hintNumber: Number(hintState?.usedHints || 0) + 1,
        },
        {
          onEvent: ({ event, data }) => {
            if (event === 'token') {
              const token = typeof data === 'string' ? data : String(data ?? '');
              streamedHint += token;
              setLatestHint(streamedHint);
              return;
            }

            if (event === 'final' && data && typeof data === 'object') {
              applyHintPayload(data);
              return;
            }

            if (event === 'error') {
              const parsed = parseHintError(data);
              streamIssue = parsed;
              setHintError(parsed.message);
              setHintState((current) => {
                if (!current) {
                  return current;
                }

                return {
                  ...current,
                  secondsRemaining:
                    parsed.secondsRemaining == null
                      ? current.secondsRemaining
                      : Math.max(parsed.secondsRemaining, 0),
                  remainingHints:
                    parsed.hintsRemaining == null
                      ? current.remainingHints
                      : Math.max(parsed.hintsRemaining, 0),
                };
              });
            }
          },
        }
      );

      if (streamIssue) {
        return;
      }
      await refetchHintStatus();
    } catch (error) {
      const parsed = parseHintError(error);
      setHintError(parsed.message);
      setHintState((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          secondsRemaining:
            parsed.secondsRemaining == null
              ? current.secondsRemaining
              : Math.max(parsed.secondsRemaining, 0),
          remainingHints:
            parsed.hintsRemaining == null
              ? current.remainingHints
              : Math.max(parsed.hintsRemaining, 0),
        };
      });
    } finally {
      setIsHintLoading(false);
    }
  }, [activeProblem, applyHintPayload, code, hintState?.usedHints, refetchHintStatus]);

  const handleGenerateReview = useCallback(async () => {
    if (!activeProblem?.id) {
      return;
    }

    setIsReviewLoading(true);
    setReviewError('');
    setReviewStreamingPreview('');
    let streamFailed = false;
    let streamBuffer = '';
    let finalReviewPayload = null;

    try {
      await requestAiReviewStream(
        {
          problemId: activeProblem.id,
          problemStatement: buildProblemStatement(activeProblem),
          userCode: code,
          language: languageLabel,
          timeComplexityClaimed: null,
          testId: null,
        },
        {
          onEvent: ({ event, data }) => {
            if (event === 'token') {
              const token = typeof data === 'string' ? data : String(data ?? '');
              streamBuffer += token;
              setReviewStreamingPreview((current) => `${current}${token}`);
              return;
            }

            if (event === 'final' && data && typeof data === 'object') {
              const review = data.review || null;
              if (!review) {
                streamFailed = true;
                setReviewError(data.message || 'Review is unavailable right now.');
                return;
              }

              finalReviewPayload = review;
              setReviewPayload(review);
              setReviewModalOpen(true);
              setReviewError('');
              return;
            }

            if (event === 'error') {
              streamFailed = true;
              const parsed = parseHintError(data);
              setReviewError(parsed.message || 'Unable to generate review.');
            }
          },
        }
      );

      if (finalReviewPayload || streamFailed) {
        return;
      }

      if (streamBuffer.trim()) {
        try {
          const parsed = JSON.parse(streamBuffer);
          setReviewPayload(parsed);
          setReviewModalOpen(true);
          setReviewError('');
          return;
        } catch {
          // Keep fallback below when stream chunks are not full JSON.
        }
      }

      setReviewError('Review is unavailable right now.');
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Unable to generate review.');
    } finally {
      setIsReviewLoading(false);
    }
  }, [activeProblem, code, languageLabel]);

  useEffect(() => {
    if (!hintState?.secondsRemaining || hintState.secondsRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setHintState((current) => {
        if (!current || current.secondsRemaining <= 0) {
          return current;
        }

        return {
          ...current,
          secondsRemaining: Math.max(current.secondsRemaining - 1, 0),
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [hintState?.secondsRemaining]);

  useEffect(() => {
    if (!latestCodeReview) {
      return;
    }

    setReviewPayload(latestCodeReview);
  }, [latestCodeReview]);

  const hintCooldownSeconds = Math.max(Number(hintState?.cooldownMinutes || 0) * 60, 1);
  const hintCooldownRemaining = Math.max(Number(hintState?.secondsRemaining || 0), 0);
  const hintCooldownProgress = Math.max(
    0,
    Math.min(((hintCooldownSeconds - hintCooldownRemaining) / hintCooldownSeconds) * 100, 100)
  );

  const handleRun = useCallback(async () => {
    setActiveTab('output');
    const summary = await runCode();

    if (summary && summary.status !== 'Accepted') {
      setQueuedAiPrompt(
        `My ${languageLabel} solution failed for ${activeProblemTitle}. Explain one likely logic issue and suggest a fix strategy without giving full final code.`
      );
    }
  }, [activeProblemTitle, languageLabel, runCode]);

  const handleSubmit = useCallback(async () => {
    setActiveTab('output');
    const result = await submitCode();
    const accepted = Boolean(result?.accepted);

    if (!accepted) {
      setQueuedAiPrompt(
        `I could not pass all test cases for ${activeProblemTitle}. Give a concise debugging checklist and one targeted hint.`
      );
      return;
    }

    if (result?.codeReview) {
      setReviewPayload(result.codeReview);
      setReviewModalOpen(true);
      setReviewError('');
    } else {
      setReviewError('Accepted. Review is still unavailable; generate one manually.');
    }
  }, [activeProblemTitle, submitCode]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setAiVisible(false);
        setReviewModalOpen(false);
        return;
      }

      if (event.key === 'Enter' && event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        void handleSubmit();
        return;
      }

      if (event.key === 'Enter' && event.ctrlKey && !event.shiftKey) {
        event.preventDefault();
        void handleRun();
        return;
      }

      if (!canCaptureShortcut(event)) {
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        toggleFocusMode();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleRun, handleSubmit, toggleFocusMode]);

  if (!activeProblem) {
    return (
      <section className="page-main" aria-label="Editor unavailable">
        <article
          className="surface-card"
          style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)' }}
        >
          <h1 style={{ fontSize: 'var(--text-2xl)' }}>No problem catalog available</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Please refresh or check the problem dataset.
          </p>
        </article>
      </section>
    );
  }

  const rightPanel = (
    <section style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'start' }}>
      <CodeEditorPanel
        languageKey={languageKey}
        languageOptions={languageOptions}
        onLanguageChange={setLanguageKey}
        code={code}
        onCodeChange={setCode}
        onRun={handleRun}
        onSubmit={handleSubmit}
        onReset={resetCode}
        onToggleAi={() => {
          setAiVisible((current) => !current);
          setActiveTab('ai');
        }}
        isRunning={isRunning}
        isSubmitting={isSubmitting}
        fontSize={fontSize}
        setFontSize={setFontSize}
        vimMode={vimMode}
        setVimMode={setVimMode}
      />

      <section
        className="surface-card"
        style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-3)' }}
      >
        <nav
          aria-label="Editor diagnostics tabs"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}
        >
          <Button
            variant={activeTab === 'output' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('output')}
          >
            <MessageSquare size={14} />
            Output
          </Button>
          <Button
            variant={activeTab === 'tests' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('tests')}
          >
            <ListTodo size={14} />
            Test Cases
          </Button>
          <Button
            variant={activeTab === 'notes' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('notes')}
          >
            <Lightbulb size={14} />
            Notes
          </Button>
          <Button
            variant={activeTab === 'hint' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('hint')}
          >
            <Sparkles size={14} />
            AI Hint
          </Button>
          <Button
            variant={activeTab === 'ai' ? 'secondary' : 'ghost'}
            onClick={() => {
              setAiVisible(true);
              setActiveTab('ai');
            }}
          >
            AI Mentor
          </Button>
        </nav>

        {activeTab === 'output' ? (
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <ExecutionResultPanel summary={runSummary} />
            {runSummary.status === 'Accepted' ? (
              <div
                className="surface-elevated"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
              >
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Accepted submission detected. Open the AI code review or regenerate it.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (reviewPayload || latestCodeReview) {
                        setReviewPayload(reviewPayload || latestCodeReview);
                        setReviewModalOpen(true);
                        return;
                      }
                      void handleGenerateReview();
                    }}
                  >
                    View Review
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => void handleGenerateReview()}
                    disabled={isReviewLoading}
                  >
                    {isReviewLoading ? <LoaderCircle size={14} className="animate-spin" /> : null}
                    Regenerate
                  </Button>
                </div>
                {lastSubmission?.message ? (
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                    {lastSubmission.message}
                  </p>
                ) : null}
                {reviewError ? (
                  <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>
                    {reviewError}
                  </p>
                ) : null}
                {isReviewLoading && reviewStreamingPreview ? (
                  <pre
                    className="mono-panel"
                    style={{
                      margin: 0,
                      padding: 'var(--space-3)',
                      maxHeight: 180,
                      overflow: 'auto',
                      color: 'var(--color-text-secondary)',
                      whiteSpace: 'pre-wrap',
                      fontSize: 'var(--text-xs)',
                    }}
                  >
                    {reviewStreamingPreview}
                  </pre>
                ) : null}
              </div>
            ) : null}
            {runSummary.status !== 'Accepted' &&
            runSummary.status !== 'Running' &&
            runSummary.status !== 'Idle' ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Need help with wrong output or runtime errors?
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAiVisible(true);
                    setActiveTab('ai');
                    setQueuedAiPrompt(
                      `Here is my latest ${languageLabel} result for ${activeProblem.title}. Help me isolate the specific failing edge case and fix approach.`
                    );
                  }}
                >
                  Ask AI for Fix
                </Button>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'tests' ? <TestCasePanel results={runSummary.results || []} /> : null}

        {activeTab === 'notes' ? (
          <section
            className="surface-elevated"
            style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
          >
            <label htmlFor="editor-notes" className="label-text">
              Scratch Notes
            </label>
            <textarea
              id="editor-notes"
              className="ui-textarea"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write edge cases, complexity notes, or bug hypotheses here..."
              style={{ minHeight: 180 }}
            />
          </section>
        ) : null}

        {activeTab === 'hint' ? (
          <section
            className="surface-elevated"
            style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-3)' }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: 'var(--space-3)',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: `conic-gradient(var(--color-accent-primary) ${hintCooldownProgress}%, color-mix(in srgb, var(--color-bg-elevated) 85%, transparent) ${hintCooldownProgress}% 100%)`,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {hintCooldownRemaining > 0 ? formatClock(hintCooldownRemaining) : 'Ready'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                  <span className="label-text">Hint Cooldown</span>
                  <strong style={{ fontSize: 'var(--text-base)' }}>
                    {hintCooldownRemaining > 0 ? 'Cooldown active' : 'Hint available'}
                  </strong>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                    {hintState?.allowHints === false
                      ? 'Hints disabled for this assessment'
                      : `Remaining ${Math.max(Number(hintState?.remainingHints || 0), 0)} of ${Math.max(Number(hintState?.maxHints || 0), 0)}`}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => void handleRequestHint()}
                disabled={
                  isHintLoading ||
                  hintState?.allowHints === false ||
                  Math.max(Number(hintState?.remainingHints || 0), 0) <= 0 ||
                  hintCooldownRemaining > 0
                }
              >
                {isHintLoading ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Sparkles size={14} />
                )}
                Request Hint
              </Button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {Array.from({ length: Math.max(Number(hintState?.maxHints || 3), 1) }).map(
                (_, index) => (
                  <span
                    key={`hint-dot-${index}`}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      border: '1px solid var(--color-border)',
                      background:
                        index < Math.max(Number(hintState?.usedHints || 0), 0)
                          ? 'var(--color-accent-secondary)'
                          : 'color-mix(in srgb, var(--color-bg-elevated) 90%, transparent)',
                    }}
                  />
                )
              )}
              <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                Hint budget tracker
              </span>
            </div>

            <pre
              className="mono-panel"
              style={{
                margin: 0,
                padding: 'var(--space-3)',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--text-sm)',
                whiteSpace: 'pre-wrap',
              }}
            >
              <code>
                {latestHint ||
                  'No hint requested yet. Run your code, then request a contextual hint.'}
              </code>
            </pre>

            {hintError ? (
              <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>
                {hintError}
              </p>
            ) : null}

            {(hintState?.hintHistory || []).length ? (
              <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                <p className="label-text">Hint History</p>
                {(hintState?.hintHistory || [])
                  .slice(-4)
                  .reverse()
                  .map((item) => (
                    <article
                      key={item.id}
                      className="surface-card"
                      style={{ padding: 'var(--space-2)', display: 'grid', gap: 'var(--space-1)' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 'var(--space-2)',
                          alignItems: 'center',
                        }}
                      >
                        <strong style={{ fontSize: 'var(--text-sm)' }}>
                          Hint {item.hintNumber}
                        </strong>
                        <span
                          style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}
                        >
                          {item.requestedAt
                            ? new Date(item.requestedAt).toLocaleString()
                            : 'just now'}
                        </span>
                      </div>
                      <p
                        style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}
                      >
                        {item.response || '(empty response)'}
                      </p>
                    </article>
                  ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'ai' && aiVisible ? (
          <AiChat
            problemContext={aiContext}
            queuedPrompt={queuedAiPrompt}
            onPromptConsumed={() => setQueuedAiPrompt('')}
          />
        ) : null}
      </section>
    </section>
  );

  const reviewTradeOffs = Array.isArray(reviewPayload?.trade_offs)
    ? reviewPayload.trade_offs
    : reviewPayload?.trade_offs
      ? [String(reviewPayload.trade_offs)]
      : [];
  const reviewSegments = Array.isArray(reviewPayload?.good_logic_segments)
    ? reviewPayload.good_logic_segments
    : [];

  return (
    <section
      className="page-main"
      aria-label="Coding editor workspace"
      style={{ display: 'grid', gap: 'var(--space-5)' }}
    >
      <header
        className="surface-card"
        style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-4)' }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
            <span className="label-text">Editor</span>
            <h1 style={{ fontSize: 'var(--text-2xl)' }}>{activeProblem.title}</h1>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              alignItems: 'center',
            }}
          >
            <div
              className="surface-elevated"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                display: 'inline-flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
              }}
            >
              <Timer size={14} color="var(--color-accent-primary)" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Elapsed {formatClock(elapsedSeconds)}
              </span>
            </div>

            <div
              className="surface-elevated"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                display: 'inline-flex',
                gap: 'var(--space-2)',
                alignItems: 'center',
              }}
            >
              <Clock3 size={14} color="var(--color-accent-secondary)" />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Target {formatClock(remainingSeconds)}
              </span>
            </div>

            <Button variant="ghost" onClick={toggleFocusMode} ariaLabel="Toggle editor focus mode">
              {focusMode ? <Eye size={14} /> : <EyeOff size={14} />}
              {focusMode ? 'Exit Focus' : 'Focus Mode'}
            </Button>
          </div>
        </div>

        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center' }}
        >
          <label htmlFor="problem-switcher" className="label-text">
            Jump to Problem
          </label>
          <select
            id="problem-switcher"
            className="ui-select"
            style={{ maxWidth: 420 }}
            value={activeProblem.id}
            onChange={(event) => navigate(`/editor/${event.target.value}`)}
            aria-label="Select problem"
          >
            {practiceProblems.map((problem) => (
              <option key={problem.id} value={problem.id}>
                {problem.title} ({problem.difficulty})
              </option>
            ))}
          </select>

          <Button variant="ghost" onClick={() => navigate('/problems')}>
            Back to List
          </Button>
        </div>
      </header>

      {focusMode ? (
        rightPanel
      ) : (
        <SplitPane
          left={<ProblemStatementPanel problem={activeProblem} />}
          right={rightPanel}
          initialLeftPercent={41}
        />
      )}

      {reviewModalOpen ? (
        <div
          className="ui-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="AI code review"
        >
          <div
            className="ui-modal-panel"
            style={{
              padding: 'var(--space-4)',
              display: 'grid',
              gap: 'var(--space-3)',
              maxHeight: '84vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <div style={{ display: 'grid', gap: 'var(--space-1)' }}>
                <span className="label-text">AI Review</span>
                <h3 style={{ fontSize: 'var(--text-xl)' }}>Post-Acceptance Code Analysis</h3>
              </div>
              <Button variant="ghost" onClick={() => setReviewModalOpen(false)}>
                <X size={14} />
                Close
              </Button>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 'var(--space-3)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
              }}
            >
              <article
                className="surface-elevated"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-1)' }}
              >
                <span className="label-text">Chess Rating</span>
                <strong style={{ fontSize: 'var(--text-lg)' }}>
                  {reviewPayload?.chess_rating || 'Good'}
                </strong>
              </article>
              <article
                className="surface-elevated"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-1)' }}
              >
                <span className="label-text">Overall Score</span>
                <strong style={{ fontSize: 'var(--text-lg)' }}>
                  {reviewPayload?.overall_score ?? '-'}
                </strong>
              </article>
              <article
                className="surface-elevated"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-1)' }}
              >
                <span className="label-text">Time Complexity</span>
                <strong style={{ fontSize: 'var(--text-base)' }}>
                  {reviewPayload?.time_complexity || 'Not specified'}
                </strong>
              </article>
              <article
                className="surface-elevated"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-1)' }}
              >
                <span className="label-text">Optimal Complexity</span>
                <strong style={{ fontSize: 'var(--text-base)' }}>
                  {reviewPayload?.optimal_complexity || 'Problem dependent'}
                </strong>
              </article>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 'var(--space-3)',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
              }}
            >
              <article
                className="surface-card"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
              >
                <span className="label-text">Best Line</span>
                <code style={{ color: 'var(--color-accent-primary)', whiteSpace: 'pre-wrap' }}>
                  {reviewPayload?.best_line?.code || 'N/A'}
                </code>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {reviewPayload?.best_line?.reason || 'No reason provided.'}
                </p>
              </article>

              <article
                className="surface-card"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
              >
                <span className="label-text">Worst Line</span>
                <code style={{ color: 'var(--color-danger)', whiteSpace: 'pre-wrap' }}>
                  {reviewPayload?.worst_line?.code || 'N/A'}
                </code>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {reviewPayload?.worst_line?.reason || 'No reason provided.'}
                </p>
              </article>
            </div>

            <article
              className="surface-card"
              style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
            >
              <span className="label-text">Suggested Approach</span>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                {reviewPayload?.suggested_approach || 'No additional suggestion available.'}
              </p>
            </article>

            {reviewSegments.length ? (
              <article
                className="surface-card"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
              >
                <span className="label-text">Good Logic Segments</span>
                {reviewSegments.map((segment, index) => (
                  <div
                    key={`segment-${index}`}
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
                      {segment?.lines || 'Segment'}
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                      {segment?.reason || 'No reason provided.'}
                    </p>
                  </div>
                ))}
              </article>
            ) : null}

            {reviewTradeOffs.length ? (
              <article
                className="surface-card"
                style={{ padding: 'var(--space-3)', display: 'grid', gap: 'var(--space-2)' }}
              >
                <span className="label-text">Trade-offs</span>
                {reviewTradeOffs.map((item, index) => (
                  <p
                    key={`tradeoff-${index}`}
                    style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}
                  >
                    {item}
                  </p>
                ))}
              </article>
            ) : null}
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {solveBurstVisible ? (
          <motion.aside
            className="surface-elevated fire-streak"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 1.02 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              right: 'var(--space-6)',
              bottom: 'var(--space-6)',
              padding: 'var(--space-4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              zIndex: 90,
            }}
          >
            <CheckCircle2 size={16} color="var(--color-success)" />
            <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>
              Great solve. Submission accepted.
            </span>
            {reviewPayload || latestCodeReview ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setReviewPayload(reviewPayload || latestCodeReview);
                  setReviewModalOpen(true);
                }}
              >
                View Review
              </Button>
            ) : null}
            <Button variant="ghost" onClick={clearSolveBurst}>
              Dismiss
            </Button>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default Editor;
