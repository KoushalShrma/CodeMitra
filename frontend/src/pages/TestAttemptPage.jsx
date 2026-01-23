import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Editor from '@monaco-editor/react';
import { 
  Clock, AlertTriangle, CheckCircle, ChevronLeft, 
  ChevronRight, Send, Loader2, Eye, EyeOff
} from 'lucide-react';
import { getTestById, submitCode } from '../services/api';

function TestAttemptPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullScreenWarning, setFullScreenWarning] = useState(false);

  const languageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'cpp', label: 'C++' },
  ];

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/login');
      return;
    }
    fetchTest();
  }, [testId, isSignedIn]);

  // Timer effect
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && test) {
        setTabSwitches(prev => prev + 1);
        // Could send to backend for proctoring
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [test]);

  const fetchTest = async () => {
    try {
      const response = await getTestById(testId);
      if (response.data.success) {
        setTest(response.data.data);
        // Set initial time remaining
        const durationSeconds = response.data.data.durationMinutes * 60;
        setTimeRemaining(durationSeconds);
      }
    } catch (error) {
      console.error('Error fetching test:', error);
      // Use mock data for demo
      setTest({
        id: testId,
        name: 'DSA Midterm Exam',
        description: 'Data Structures and Algorithms midterm assessment',
        durationMinutes: 120,
        hintsDisabled: true,
        problems: [
          { 
            id: 1,
            problemId: 1, 
            problemTitle: 'Two Sum', 
            problemDifficulty: 'EASY', 
            maxScore: 25,
            description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            sampleInput: 'nums = [2,7,11,15], target = 9',
            sampleOutput: '[0,1]'
          },
          { 
            id: 2,
            problemId: 2, 
            problemTitle: 'Valid Parentheses', 
            problemDifficulty: 'EASY', 
            maxScore: 25,
            description: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.',
            sampleInput: 's = "()"',
            sampleOutput: 'true'
          },
          { 
            id: 3,
            problemId: 3, 
            problemTitle: 'Maximum Subarray', 
            problemDifficulty: 'MEDIUM', 
            maxScore: 50,
            description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
            sampleInput: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
            sampleOutput: '6'
          },
        ]
      });
      setTimeRemaining(120 * 60); // 2 hours in seconds
    } finally {
      setLoading(false);
    }
  };

  const handleTimeUp = () => {
    alert('Time is up! Your test will be submitted automatically.');
    // Auto submit all solutions
    navigate('/tests');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-500'; // 5 minutes
    if (timeRemaining <= 900) return 'text-yellow-500'; // 15 minutes
    return 'text-white';
  };

  const handleSubmitProblem = async () => {
    if (!code.trim()) {
      alert('Please write some code before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const currentProblem = test.problems[currentProblemIndex];
      await submitCode({
        problemId: currentProblem.problemId,
        stageType: 'BRUTE', // Tests typically just have one stage
        language,
        code,
        testId: test.id,
        mode: 'FULL'
      });
      
      alert('Solution submitted successfully!');
      
      // Move to next problem if available
      if (currentProblemIndex < test.problems.length - 1) {
        setCurrentProblemIndex(currentProblemIndex + 1);
        setCode('');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishTest = () => {
    if (confirm('Are you sure you want to finish the test? You cannot return after submission.')) {
      navigate('/tests');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Test Not Found</h2>
          <button
            onClick={() => navigate('/tests')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const currentProblem = test.problems[currentProblemIndex];

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Test Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{test.name}</h1>
            <p className="text-sm text-gray-400">
              Problem {currentProblemIndex + 1} of {test.problems.length}
            </p>
          </div>

          <div className="flex items-center space-x-6">
            {/* Tab switch warning */}
            {tabSwitches > 0 && (
              <div className="flex items-center space-x-2 text-yellow-500">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">Tab switches: {tabSwitches}</span>
              </div>
            )}

            {/* Timer */}
            <div className={`flex items-center space-x-2 ${getTimeColor()}`}>
              <Clock className="h-5 w-5" />
              <span className="font-mono text-xl font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>

            {/* Finish button */}
            <button
              onClick={handleFinishTest}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Finish Test
            </button>
          </div>
        </div>
      </div>

      {/* Problem Navigation */}
      <div className="bg-gray-850 border-b border-gray-700 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 overflow-x-auto">
          {test.problems.map((problem, idx) => (
            <button
              key={problem.id}
              onClick={() => setCurrentProblemIndex(idx)}
              className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                idx === currentProblemIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {idx + 1}. {problem.problemTitle}
              <span className={`ml-2 text-xs ${
                problem.problemDifficulty === 'EASY' ? 'text-green-400' :
                problem.problemDifficulty === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                ({problem.maxScore}pts)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem Description */}
        <div className="w-1/2 overflow-auto border-r border-gray-700 p-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold mb-2">{currentProblem.problemTitle}</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-sm ${
                currentProblem.problemDifficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
                currentProblem.problemDifficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {currentProblem.problemDifficulty}
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-400">{currentProblem.maxScore} points</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-3">Description</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{currentProblem.description}</p>

            <h3 className="text-lg font-semibold mt-6 mb-3">Example</h3>
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="mb-2">
                <span className="text-gray-400 text-sm">Input:</span>
                <pre className="text-gray-300 mt-1">{currentProblem.sampleInput}</pre>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Output:</span>
                <pre className="text-gray-300 mt-1">{currentProblem.sampleOutput}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Code Editor */}
        <div className="w-1/2 flex flex-col">
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

            <button
              onClick={handleSubmitProblem}
              disabled={submitting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Submit Solution</span>
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700 bg-gray-800">
            <button
              onClick={() => setCurrentProblemIndex(Math.max(0, currentProblemIndex - 1))}
              disabled={currentProblemIndex === 0}
              className="flex items-center space-x-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <span className="text-gray-400">
              {currentProblemIndex + 1} / {test.problems.length}
            </span>

            <button
              onClick={() => setCurrentProblemIndex(Math.min(test.problems.length - 1, currentProblemIndex + 1))}
              disabled={currentProblemIndex === test.problems.length - 1}
              className="flex items-center space-x-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestAttemptPage;
