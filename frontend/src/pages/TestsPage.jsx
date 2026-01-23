import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  Calendar, Clock, Users, ChevronRight, Play, 
  CheckCircle, AlertCircle, Plus, Filter
} from 'lucide-react';
import { getTests } from '../services/api';

function TestsPage() {
  const { user } = useUser();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, active, completed

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await getTests();
      if (response.data.success) {
        setTests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      // Use mock data for demo
      setTests([
        {
          id: 1,
          name: 'DSA Midterm Exam',
          description: 'Data Structures and Algorithms midterm assessment',
          startTime: '2024-01-20T10:00:00',
          endTime: '2024-01-20T12:00:00',
          durationMinutes: 120,
          participantStatus: 'NOT_STARTED',
          problems: [
            { problemTitle: 'Two Sum', problemDifficulty: 'EASY', maxScore: 25 },
            { problemTitle: 'Valid Parentheses', problemDifficulty: 'EASY', maxScore: 25 },
            { problemTitle: 'Maximum Subarray', problemDifficulty: 'MEDIUM', maxScore: 50 },
          ]
        },
        {
          id: 2,
          name: 'Arrays and Strings Quiz',
          description: 'Quick quiz on array and string manipulation',
          startTime: '2024-01-15T14:00:00',
          endTime: '2024-01-15T15:00:00',
          durationMinutes: 60,
          participantStatus: 'COMPLETED',
          participantScore: 85,
          problems: [
            { problemTitle: 'Reverse String', problemDifficulty: 'EASY', maxScore: 50 },
            { problemTitle: 'Contains Duplicate', problemDifficulty: 'EASY', maxScore: 50 },
          ]
        },
        {
          id: 3,
          name: 'Weekly Coding Challenge',
          description: 'This week\'s coding challenge covering various topics',
          startTime: '2024-01-25T09:00:00',
          endTime: '2024-01-25T11:00:00',
          durationMinutes: 120,
          participantStatus: null,
          problems: [
            { problemTitle: 'Binary Search', problemDifficulty: 'EASY', maxScore: 30 },
            { problemTitle: 'LRU Cache', problemDifficulty: 'MEDIUM', maxScore: 35 },
            { problemTitle: 'Merge K Sorted Lists', problemDifficulty: 'HARD', maxScore: 35 },
          ]
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getTestStatus = (test) => {
    const now = new Date();
    const start = new Date(test.startTime);
    const end = new Date(test.endTime);

    if (test.participantStatus === 'COMPLETED') return 'completed';
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: 'Upcoming', class: 'bg-blue-500/20 text-blue-400' },
      active: { text: 'Active Now', class: 'bg-green-500/20 text-green-400' },
      completed: { text: 'Completed', class: 'bg-gray-500/20 text-gray-400' },
      ended: { text: 'Ended', class: 'bg-red-500/20 text-red-400' },
    };
    return badges[status] || badges.upcoming;
  };

  const filteredTests = tests.filter(test => {
    if (filter === 'all') return true;
    return getTestStatus(test) === filter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Coding Tests</h1>
          <p className="text-gray-400">
            View upcoming tests and check your past performance.
          </p>
        </div>
        
        {/* Filter */}
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            <option value="all">All Tests</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tests List */}
      {filteredTests.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg">
          <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No tests found for the selected filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => {
            const status = getTestStatus(test);
            const badge = getStatusBadge(status);

            return (
              <div
                key={test.id}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold">{test.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-4">{test.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(test.startTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{test.durationMinutes} minutes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{test.problems?.length || 0} problems</span>
                      </div>
                    </div>

                    {/* Problems Preview */}
                    {test.problems && test.problems.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {test.problems.map((problem, idx) => (
                          <span 
                            key={idx}
                            className={`px-2 py-1 rounded text-xs ${
                              problem.problemDifficulty === 'EASY' ? 'bg-green-500/20 text-green-400' :
                              problem.problemDifficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {problem.problemTitle} ({problem.maxScore}pts)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col items-start lg:items-end space-y-2">
                    {status === 'completed' && test.participantScore !== undefined && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">{test.participantScore}%</p>
                        <p className="text-sm text-gray-400">Your Score</p>
                      </div>
                    )}

                    {status === 'active' && (
                      <Link
                        to={`/tests/${test.id}`}
                        className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <Play className="h-4 w-4" />
                        <span>Start Test</span>
                      </Link>
                    )}

                    {status === 'upcoming' && (
                      <button
                        disabled
                        className="flex items-center space-x-2 px-6 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Not Yet Available</span>
                      </button>
                    )}

                    {status === 'completed' && (
                      <Link
                        to={`/tests/${test.id}`}
                        className="flex items-center space-x-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>View Results</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TestsPage;
