import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Editor from '@monaco-editor/react';
import { 
  Play, Send, Lightbulb, ChevronRight, CheckCircle, 
  Circle, Clock, AlertCircle, Loader2, RefreshCw
} from 'lucide-react';
import { getProblemBySlug, runCode, submitCode, requestHint } from '../services/api';

function ProblemSolvePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  
  // Problem state
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Code editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [activeStage, setActiveStage] = useState('BRUTE');
  
  // Execution state
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [output, setOutput] = useState(null);
  
  // Hint state
  const [hint, setHint] = useState(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [startTime, setStartTime] = useState(null);

  // Language configurations
  const languageOptions = [
    { value: 'python', label: 'Python', monacoLang: 'python' },
    { value: 'java', label: 'Java', monacoLang: 'java' },
    { value: 'javascript', label: 'JavaScript', monacoLang: 'javascript' },
    { value: 'cpp', label: 'C++', monacoLang: 'cpp' },
  ];

  const stages = [
    { value: 'BRUTE', label: 'Brute Force', color: 'red' },
    { value: 'IMPROVED', label: 'Improved', color: 'yellow' },
    { value: 'OPTIMAL', label: 'Optimal', color: 'green' },
  ];

  // Default code templates
  const codeTemplates = {
    python: `# Write your solution here\ndef solve():\n    pass\n\n# Read input and call solve\nsolve()`,
    java: `// Write your solution here\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`,
    javascript: `// Write your solution here\nfunction solve() {\n    // Your code here\n}\n\nsolve();`,
    cpp: `// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}`,
  };

  useEffect(() => {
    fetchProblem();
    setStartTime(Date.now());
  }, [slug]);

  useEffect(() => {
    setCode(codeTemplates[language] || '');
  }, [language]);

  const fetchProblem = async () => {
    setLoading(true);
    try {
      const response = await getProblemBySlug(slug);
      if (response.data.success) {
        setProblem(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching problem:', err);
      // Use mock data for demo
      setProblem({
        id: 1,
        title: 'Two Sum',
        slug: 'two-sum',
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        difficulty: 'EASY',
        patternTag: 'Arrays',
        constraintsText: `2 <= nums.length <= 10^4
-10^9 <= nums[i] <= 10^9
-10^9 <= target <= 10^9
Only one valid answer exists.`,
        sampleInput: `nums = [2,7,11,15], target = 9`,
        sampleOutput: `[0,1]`,
        stages: [
          { stageType: 'BRUTE', expectedTimeComplexity: 'O(n²)', expectedSpaceComplexity: 'O(1)', minAttemptsBeforeHint: 2, minSecondsBeforeHint: 90 },
          { stageType: 'IMPROVED', expectedTimeComplexity: 'O(n)', expectedSpaceComplexity: 'O(n)', minAttemptsBeforeHint: 2, minSecondsBeforeHint: 90 },
          { stageType: 'OPTIMAL', expectedTimeComplexity: 'O(n)', expectedSpaceComplexity: 'O(n)', minAttemptsBeforeHint: 2, minSecondsBeforeHint: 90 },
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (!isSignedIn) {
      navigate('/login', { state: { from: { pathname: `/problems/${slug}` } } });
      return;
    }

    setRunning(true);
    setOutput(null);
    
    try {
      const response = await runCode({
        problemId: problem.id,
        stageType: activeStage,
        language,
        code,
        mode: 'SAMPLE'
      });
      
      if (response.data.success) {
        setOutput(response.data.data);
        setAttemptCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error running code:', err);
      setOutput({
        status: 'ERROR',
        stderr: err.response?.data?.message || 'Failed to run code. Please try again.',
        testResults: []
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!isSignedIn) {
      navigate('/login', { state: { from: { pathname: `/problems/${slug}` } } });
      return;
    }

    setSubmitting(true);
    setOutput(null);
    
    try {
      const response = await submitCode({
        problemId: problem.id,
        stageType: activeStage,
        language,
        code,
        mode: 'FULL'
      });
      
      if (response.data.success) {
        setOutput(response.data.data);
        setAttemptCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error submitting code:', err);
      setOutput({
        status: 'ERROR',
        stderr: err.response?.data?.message || 'Failed to submit code. Please try again.',
        testResults: []
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestHint = async () => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }

    setHintLoading(true);
    setHintError(null);
    
    try {
      const response = await requestHint({
        problemId: problem.id,
        stageType: activeStage,
        userCode: code,
        errorMessage: output?.stderr || ''
      });
      
      if (response.data.success) {
        setHint(response.data.data);
      }
    } catch (err) {
      console.error('Error requesting hint:', err);
      setHintError(err.response?.data?.message || 'Unable to get hint. Make sure you have at least 2 attempts and 90 seconds elapsed.');
    } finally {
      setHintLoading(false);
    }
  };

  const canRequestHint = () => {
    if (!isSignedIn) return false;
    const stage = problem?.stages?.find(s => s.stageType === activeStage);
    if (!stage) return true; // Allow by default if no stage info
    
    const secondsElapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    return attemptCount >= (stage.minAttemptsBeforeHint || 2) || 
           secondsElapsed >= (stage.minSecondsBeforeHint || 90);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED': return 'text-green-500';
      case 'FAILED': return 'text-red-500';
      case 'ERROR': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Problem Not Found</h2>
          <p className="text-gray-400 mb-4">The problem you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/problems')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row">
      {/* Left Panel - Problem Description */}
      <div className="lg:w-1/2 h-1/2 lg:h-full overflow-auto bg-gray-900 border-r border-gray-700">
        <div className="p-6">
          {/* Problem Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold">{problem.title}</h1>
              <span className={`px-2 py-1 rounded text-sm font-medium ${
                problem.difficulty === 'EASY' ? 'text-green-500 bg-green-500/10' :
                problem.difficulty === 'MEDIUM' ? 'text-yellow-500 bg-yellow-500/10' :
                'text-red-500 bg-red-500/10'
              }`}>
                {problem.difficulty}
              </span>
            </div>
            <span className="px-2 py-1 bg-gray-800 rounded text-sm text-gray-300">
              {problem.patternTag}
            </span>
          </div>

          {/* Stage Tabs */}
          <div className="mb-6">
            <div className="flex space-x-2 border-b border-gray-700 pb-2">
              {stages.map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => setActiveStage(stage.value)}
                  className={`px-4 py-2 rounded-t-lg transition flex items-center space-x-2 ${
                    activeStage === stage.value 
                      ? `bg-${stage.color}-500/20 text-${stage.color}-400 border-b-2 border-${stage.color}-500`
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {activeStage === stage.value ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                  <span>{stage.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stage Info */}
          {problem.stages && (
            <div className="mb-6 p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2 text-sm text-gray-400 uppercase">
                Expected Complexity for {stages.find(s => s.value === activeStage)?.label}
              </h3>
              {problem.stages.filter(s => s.stageType === activeStage).map(stage => (
                <div key={stage.stageType} className="flex space-x-4 text-sm">
                  <span className="text-gray-300">
                    Time: <span className="text-blue-400">{stage.expectedTimeComplexity || 'N/A'}</span>
                  </span>
                  <span className="text-gray-300">
                    Space: <span className="text-blue-400">{stage.expectedSpaceComplexity || 'N/A'}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Problem Description */}
          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <pre className="whitespace-pre-wrap text-gray-300 bg-transparent p-0 font-sans">
              {problem.description}
            </pre>

            {problem.constraintsText && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-3">Constraints</h3>
                <pre className="whitespace-pre-wrap text-gray-400 bg-gray-800 p-4 rounded-lg text-sm">
                  {problem.constraintsText}
                </pre>
              </>
            )}

            <h3 className="text-lg font-semibold mt-6 mb-3">Example</h3>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="mb-2">
                <span className="text-gray-400 text-sm">Input:</span>
                <pre className="text-gray-300 mt-1">{problem.sampleInput}</pre>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Output:</span>
                <pre className="text-gray-300 mt-1">{problem.sampleOutput}</pre>
              </div>
            </div>
          </div>

          {/* Hint Section */}
          <div className="mt-6">
            <button
              onClick={handleRequestHint}
              disabled={!canRequestHint() || hintLoading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                canRequestHint() 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {hintLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              <span>Request Hint</span>
            </button>
            
            {!canRequestHint() && (
              <p className="text-gray-500 text-sm mt-2">
                Need {Math.max(0, 2 - attemptCount)} more attempts or wait longer to unlock hints.
              </p>
            )}

            {hintError && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
                {hintError}
              </div>
            )}

            {hint && (
              <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-yellow-400">Hint</span>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap">{hint.hintText}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Code Editor */}
      <div className="lg:w-1/2 h-1/2 lg:h-full flex flex-col bg-gray-800">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            {languageOptions.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCode(codeTemplates[language])}
              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition text-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleRun}
              disabled={running || submitting}
              className="flex items-center space-x-1 px-4 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition text-sm disabled:opacity-50"
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              <span>Run</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={running || submitting}
              className="flex items-center space-x-1 px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={languageOptions.find(l => l.value === language)?.monacoLang || 'python'}
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Output Panel */}
        {output && (
          <div className="h-48 border-t border-gray-700 overflow-auto">
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className={`font-semibold ${getStatusColor(output.status)}`}>
                  {output.status}
                </span>
                {output.runtimeMs && (
                  <span className="text-gray-400 text-sm">
                    Runtime: {output.runtimeMs}ms
                  </span>
                )}
              </div>

              {output.testResults && output.testResults.length > 0 && (
                <div className="space-y-2">
                  {output.testResults.map((result, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg ${
                        result.passed ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">Test Case {result.testCaseNumber}</span>
                      </div>
                      {!result.passed && (
                        <div className="text-sm mt-2 space-y-1">
                          <div><span className="text-gray-400">Expected:</span> <code className="text-gray-300">{result.expectedOutput}</code></div>
                          <div><span className="text-gray-400">Actual:</span> <code className="text-gray-300">{result.actualOutput}</code></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {output.stdout && (
                <div className="mt-3">
                  <span className="text-gray-400 text-sm">Output:</span>
                  <pre className="bg-gray-900 p-3 rounded mt-1 text-sm text-gray-300 overflow-x-auto">
                    {output.stdout}
                  </pre>
                </div>
              )}

              {output.stderr && (
                <div className="mt-3">
                  <span className="text-red-400 text-sm">Error:</span>
                  <pre className="bg-red-900/20 p-3 rounded mt-1 text-sm text-red-300 overflow-x-auto">
                    {output.stderr}
                  </pre>
                </div>
              )}

              {output.stageCompleted && (
                <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-400">
                      Stage Completed! 🎉
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">
                    Great job! You've completed the {stages.find(s => s.value === activeStage)?.label} stage.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemSolvePage;
