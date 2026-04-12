import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { createInstitutionTestV2, getInstitutionCurrentProfile } from '../services/apiClient';
import { getInstitutionSession } from '../utils/institutionSession';
import { practiceProblems, practiceTestCases } from '../data/practiceProblems';

function createEmptyQuestion() {
  return {
    id: crypto.randomUUID(),
    mode: 'existing',
    problemId: '',
    customQuestion: '',
    difficulty: 'Easy',
    topic: '',
    pattern: '',
    testCases: [{ id: crypto.randomUUID(), input: '', expectedOutput: '' }],
  };
}

function CreateTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const session = getInstitutionSession();
  const sessionInstitutionId = String(session?.institution?.id || '');
  const sessionToken = session?.token || '';

  const institutionProfileQuery = useQuery({
    queryKey: ['institutionAuthProfile', 'create-test'],
    queryFn: getInstitutionCurrentProfile,
    enabled: Boolean(sessionToken) && !sessionInstitutionId,
  });

  const institutionId =
    query.get('institutionId')
    || sessionInstitutionId
    || String(institutionProfileQuery.data?.institution?.id || '');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    startTime: '',
    endTime: '',
    joinCode: '',
    accessScope: 'INSTITUTION_MEMBERS',
    published: true,
    allowMultipleAttempts: false,
    antiCheatingEnabled: true,
    showResultsImmediately: false,
  });
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [createdJoinCode, setCreatedJoinCode] = useState('');
  const profileErrorMessage =
    institutionProfileQuery.error instanceof Error ? institutionProfileQuery.error.message : '';

  const existingProblemOptions = useMemo(() => practiceProblems.slice(0, 40), []);

  const handleDetailsChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const updateQuestion = (questionId, updater) => {
    setQuestions((current) =>
      current.map((question) => (question.id === questionId ? updater(question) : question))
    );
  };

  const handleQuestionModeChange = (questionId, mode) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      mode,
      problemId: '',
      customQuestion: '',
      topic: '',
      pattern: '',
      testCases: [{ id: crypto.randomUUID(), input: '', expectedOutput: '' }],
    }));
  };

  const handleExistingProblemSelect = (questionId, problemId) => {
    const selectedProblem = practiceProblems.find((problem) => problem.id === problemId);
    const selectedTestCases = (practiceTestCases[problemId] || []).map((testCase) => ({
      id: crypto.randomUUID(),
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
    }));

    updateQuestion(questionId, (question) => ({
      ...question,
      problemId,
      customQuestion: selectedProblem?.description || '',
      difficulty: selectedProblem?.difficulty || 'Easy',
      topic: selectedProblem?.topic || '',
      pattern: selectedProblem?.pattern || '',
      testCases: selectedTestCases.length
        ? selectedTestCases
        : [{ id: crypto.randomUUID(), input: '', expectedOutput: '' }],
    }));
  };

  const handleQuestionChange = (questionId, field, value) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      [field]: value,
    }));
  };

  const handleTestCaseChange = (questionId, testCaseId, field, value) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      testCases: question.testCases.map((testCase) =>
        testCase.id === testCaseId ? { ...testCase, [field]: value } : testCase
      ),
    }));
  };

  const addQuestion = () => {
    setQuestions((current) => [...current, createEmptyQuestion()]);
  };

  const removeQuestion = (questionId) => {
    setQuestions((current) =>
      current.length > 1 ? current.filter((question) => question.id !== questionId) : current
    );
  };

  const addTestCase = (questionId) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      testCases: [
        ...question.testCases,
        { id: crypto.randomUUID(), input: '', expectedOutput: '' },
      ],
    }));
  };

  const removeTestCase = (questionId, testCaseId) => {
    updateQuestion(questionId, (question) => ({
      ...question,
      testCases:
        question.testCases.length > 1
          ? question.testCases.filter((testCase) => testCase.id !== testCaseId)
          : question.testCases,
    }));
  };

  const validateForm = () => {
    if (Number(formData.duration) <= 0) {
      return 'Duration must be greater than 0';
    }

    if (
      formData.startTime &&
      formData.endTime &&
      new Date(formData.endTime) <= new Date(formData.startTime)
    ) {
      return 'End time must be later than start time';
    }

    if (questions.length === 0) {
      return 'At least 1 question is required';
    }

    const invalidQuestion = questions.find((question) => {
      if (!question.difficulty || !question.topic || !question.pattern) {
        return true;
      }

      if (question.mode === 'existing' && !question.problemId) {
        return true;
      }

      if (question.mode === 'custom' && !question.customQuestion.trim()) {
        return true;
      }

      return question.testCases.some(
        (testCase) => !testCase.input.trim() || !testCase.expectedOutput.trim()
      );
    });

    if (invalidQuestion) {
      return 'Each question must be complete and contain at least one valid test case';
    }

    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setCreatedJoinCode('');

    const validationMessage = validateForm();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!institutionId) {
        throw new Error('Institution login is required to create a test');
      }

      const hasCustomQuestion = questions.some((question) => question.mode === 'custom');
      if (hasCustomQuestion) {
        throw new Error(
          'Custom questions require custom-problem creation first. Use existing problem mode only.'
        );
      }

      const response = await createInstitutionTestV2(institutionId, {
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        durationMinutes: Number(formData.duration),
        allowAiHints: true,
        aiHintCooldownMinutes: 10,
        maxHintsPerProblem: 3,
        isProctored: formData.antiCheatingEnabled,
        joinCode: formData.joinCode || null,
        accessScope: formData.accessScope,
        published: Boolean(formData.published),
        problems: questions.map((question, index) => ({
          problemId: question.problemId,
          orderIndex: index + 1,
          marks: 100,
        })),
      });

      setSuccessMessage(response.message || 'Test created successfully');
      setCreatedJoinCode(response?.test?.joinCode || '');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-8 fade-slide-in">
      <div className="card-surface p-7 sm:p-10">
        <p className="text-sm font-medium text-brand-accent">Institutional Test Setup</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Create Coding Test</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-brand-muted">
          Configure test details, choose questions from the existing library or define custom
          prompts, and attach the test cases students will be evaluated against.
        </p>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <section className="card-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-brand-text">1. Test Details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="test-title"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Test Title
              </label>
              <input
                id="test-title"
                name="title"
                value={formData.title}
                onChange={handleDetailsChange}
                required
                className="form-input"
                placeholder="Campus Placement Round 1"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="test-description"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Description
              </label>
              <textarea
                id="test-description"
                name="description"
                value={formData.description}
                onChange={handleDetailsChange}
                rows={4}
                className="form-input"
                placeholder="Describe the objective, eligibility, and instructions for this test."
              />
            </div>
            <div>
              <label
                htmlFor="test-duration"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Total Duration (minutes)
              </label>
              <input
                id="test-duration"
                name="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={handleDetailsChange}
                required
                className="form-input"
              />
            </div>
            <div>
              <label
                htmlFor="test-start-time"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Start Time
              </label>
              <input
                id="test-start-time"
                name="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={handleDetailsChange}
                required
                className="form-input"
              />
            </div>
            <div>
              <label
                htmlFor="test-end-time"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                End Time
              </label>
              <input
                id="test-end-time"
                name="endTime"
                type="datetime-local"
                value={formData.endTime}
                onChange={handleDetailsChange}
                required
                className="form-input"
              />
            </div>

            <div>
              <label
                htmlFor="test-join-code"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Join Code (optional)
              </label>
              <input
                id="test-join-code"
                name="joinCode"
                value={formData.joinCode}
                onChange={handleDetailsChange}
                className="form-input"
                placeholder="PLACEMENT-2026"
              />
            </div>

            <div>
              <label
                htmlFor="test-access-scope"
                className="mb-1.5 block text-sm font-medium text-brand-muted"
              >
                Access Scope
              </label>
              <select
                id="test-access-scope"
                name="accessScope"
                value={formData.accessScope}
                onChange={handleDetailsChange}
                className="form-input"
              >
                <option value="INSTITUTION_MEMBERS">Institution Members</option>
                <option value="PUBLIC">Public</option>
              </select>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ['published', 'Published'],
              ['allowMultipleAttempts', 'Allow Multiple Attempts'],
              ['antiCheatingEnabled', 'Enable Anti-Cheating'],
              ['showResultsImmediately', 'Show Results Immediately'],
            ].map(([name, label]) => (
              <label
                key={name}
                className="flex items-center justify-between rounded-xl border border-brand-border/70 bg-brand-elevated/35 px-4 py-3 text-sm text-brand-text"
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  name={name}
                  checked={formData[name]}
                  onChange={handleDetailsChange}
                  className="h-4 w-4 accent-brand-accent"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="card-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-brand-text">2. Add Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="rounded-xl border border-brand-border bg-brand-elevated px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-secondary"
            >
              Add Question
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-2xl border border-brand-border/70 bg-brand-elevated/25 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-brand-text">Question {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(question.id)}
                    className="rounded-lg border border-rose-500/35 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    ['existing', 'Select from existing problems'],
                    ['custom', 'Create custom problem'],
                  ].map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleQuestionModeChange(question.id, mode)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                        question.mode === mode
                          ? 'border-brand-secondary bg-brand-elevated text-brand-text'
                          : 'border-brand-border bg-brand-elevated/35 text-brand-muted hover:border-brand-secondary/60 hover:text-brand-text'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {question.mode === 'existing' ? (
                  <div className="mt-4">
                    <label
                      htmlFor={`existing-problem-${question.id}`}
                      className="mb-1.5 block text-sm font-medium text-brand-muted"
                    >
                      Existing Problem
                    </label>
                    <select
                      id={`existing-problem-${question.id}`}
                      value={question.problemId}
                      onChange={(event) =>
                        handleExistingProblemSelect(question.id, event.target.value)
                      }
                      className="form-input"
                    >
                      <option value="">Select a problem</option>
                      {existingProblemOptions.map((problem) => (
                        <option key={problem.id} value={problem.id}>
                          {problem.title} | {problem.difficulty} | {problem.topic}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label
                      htmlFor={`custom-question-${question.id}`}
                      className="mb-1.5 block text-sm font-medium text-brand-muted"
                    >
                      Custom Question
                    </label>
                    <textarea
                      id={`custom-question-${question.id}`}
                      value={question.customQuestion}
                      onChange={(event) =>
                        handleQuestionChange(question.id, 'customQuestion', event.target.value)
                      }
                      rows={4}
                      className="form-input"
                      placeholder="Write the custom coding question here."
                    />
                  </div>
                )}

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor={`difficulty-${question.id}`}
                      className="mb-1.5 block text-sm font-medium text-brand-muted"
                    >
                      Difficulty
                    </label>
                    <select
                      id={`difficulty-${question.id}`}
                      value={question.difficulty}
                      onChange={(event) =>
                        handleQuestionChange(question.id, 'difficulty', event.target.value)
                      }
                      className="form-input"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor={`topic-${question.id}`}
                      className="mb-1.5 block text-sm font-medium text-brand-muted"
                    >
                      Topic
                    </label>
                    <input
                      id={`topic-${question.id}`}
                      value={question.topic}
                      onChange={(event) =>
                        handleQuestionChange(question.id, 'topic', event.target.value)
                      }
                      className="form-input"
                      placeholder="Array"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`pattern-${question.id}`}
                      className="mb-1.5 block text-sm font-medium text-brand-muted"
                    >
                      Pattern
                    </label>
                    <input
                      id={`pattern-${question.id}`}
                      value={question.pattern}
                      onChange={(event) =>
                        handleQuestionChange(question.id, 'pattern', event.target.value)
                      }
                      className="form-input"
                      placeholder="Hashing"
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-brand-border/70 bg-brand-bg/35 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
                      Test Cases
                    </h4>
                    <button
                      type="button"
                      onClick={() => addTestCase(question.id)}
                      className="rounded-lg border border-brand-border bg-brand-elevated px-3 py-1.5 text-xs font-semibold text-brand-text transition hover:border-brand-secondary"
                    >
                      Add Test Case
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {question.testCases.map((testCase, testCaseIndex) => (
                      <div
                        key={testCase.id}
                        className="rounded-xl border border-brand-border/60 bg-brand-elevated/25 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-brand-text">
                            Case {testCaseIndex + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeTestCase(question.id, testCase.id)}
                            className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                          <div>
                            <label
                              htmlFor={`testcase-input-${question.id}-${testCase.id}`}
                              className="mb-1.5 block text-sm font-medium text-brand-muted"
                            >
                              Input
                            </label>
                            <textarea
                              id={`testcase-input-${question.id}-${testCase.id}`}
                              value={testCase.input}
                              onChange={(event) =>
                                handleTestCaseChange(
                                  question.id,
                                  testCase.id,
                                  'input',
                                  event.target.value
                                )
                              }
                              rows={3}
                              className="form-input"
                              placeholder="[2,7,11,15], 9"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`testcase-output-${question.id}-${testCase.id}`}
                              className="mb-1.5 block text-sm font-medium text-brand-muted"
                            >
                              Expected Output
                            </label>
                            <textarea
                              id={`testcase-output-${question.id}-${testCase.id}`}
                              value={testCase.expectedOutput}
                              onChange={(event) =>
                                handleTestCaseChange(
                                  question.id,
                                  testCase.id,
                                  'expectedOutput',
                                  event.target.value
                                )
                              }
                              rows={3}
                              className="form-input"
                              placeholder="[0,1]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isSubmitting} className="form-button">
            {isSubmitting ? 'Saving test...' : 'Save Test'}
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(institutionId ? '/institution/dashboard' : '/institute-dashboard')
            }
            className="rounded-xl border border-brand-border bg-brand-elevated px-5 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-secondary"
          >
            Cancel
          </button>
        </div>

        {successMessage ? <p className="status-success">{successMessage}</p> : null}
        {createdJoinCode ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <p className="font-semibold">Unique Join Code</p>
            <p className="mt-1 font-mono text-base tracking-wide">{createdJoinCode}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(createdJoinCode)}
                className="rounded-lg border border-emerald-300/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
              >
                Copy Code
              </button>
              <button
                type="button"
                onClick={() => navigate('/institution/dashboard')}
                className="rounded-lg border border-brand-border bg-brand-elevated px-3 py-1.5 text-xs font-semibold text-brand-text transition hover:border-brand-secondary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : null}
        {errorMessage || profileErrorMessage ? (
          <p className="status-error">{errorMessage || profileErrorMessage}</p>
        ) : null}
      </form>
    </section>
  );
}

export default CreateTestPage;
