import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, CheckCircle, Circle, ChevronDown } from 'lucide-react';
import { getProblems, getPatterns } from '../services/api';
import { useAuth } from '@clerk/clerk-react';

function ProblemsPage() {
  const [problems, setProblems] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSignedIn } = useAuth();

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [pattern, setPattern] = useState(searchParams.get('pattern') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchPatterns();
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [difficulty, pattern, page, isSignedIn]);

  const fetchPatterns = async () => {
    try {
      const response = await getPatterns();
      if (response.data.success) {
        setPatterns(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
    }
  };

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const params = { page, size: 20 };
      if (difficulty) params.difficulty = difficulty;
      if (pattern) params.pattern = pattern;
      if (search) params.search = search;

      const response = await getProblems(params);
      if (response.data.success) {
        setProblems(response.data.data.content);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
      // Use mock data for demo
      setProblems([
        { id: 1, title: 'Two Sum', slug: 'two-sum', difficulty: 'EASY', patternTag: 'Arrays', progress: { bruteCompleted: true, improvedCompleted: true, optimalCompleted: false } },
        { id: 2, title: 'Valid Parentheses', slug: 'valid-parentheses', difficulty: 'EASY', patternTag: 'Stack', progress: null },
        { id: 3, title: 'Maximum Subarray', slug: 'maximum-subarray', difficulty: 'MEDIUM', patternTag: 'Dynamic Programming', progress: { bruteCompleted: true, improvedCompleted: false, optimalCompleted: false } },
        { id: 4, title: 'Longest Substring Without Repeating', slug: 'longest-substring-without-repeating', difficulty: 'MEDIUM', patternTag: 'Sliding Window', progress: null },
        { id: 5, title: 'Merge K Sorted Lists', slug: 'merge-k-sorted-lists', difficulty: 'HARD', patternTag: 'Heap', progress: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchProblems();
    updateSearchParams();
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (difficulty) params.set('difficulty', difficulty);
    if (pattern) params.set('pattern', pattern);
    setSearchParams(params);
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toUpperCase()) {
      case 'EASY': return 'text-green-500 bg-green-500/10';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10';
      case 'HARD': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getProgressIcon = (completed) => {
    return completed 
      ? <CheckCircle className="h-5 w-5 text-green-500" /> 
      : <Circle className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Problem Explorer</h1>
        <p className="text-gray-400">
          Practice coding problems organized by patterns. Progress through Brute → Improved → Optimal.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition md:hidden"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
            <ChevronDown className={`h-4 w-4 transform transition ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Desktop Filters */}
          <div className="hidden md:flex gap-4">
            <select
              value={difficulty}
              onChange={(e) => { setDifficulty(e.target.value); setPage(0); }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <select
              value={pattern}
              onChange={(e) => { setPattern(e.target.value); setPage(0); }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="">All Patterns</option>
              {patterns.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Search
          </button>
        </form>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="mt-4 flex flex-col gap-4 md:hidden">
            <select
              value={difficulty}
              onChange={(e) => { setDifficulty(e.target.value); setPage(0); }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>

            <select
              value={pattern}
              onChange={(e) => { setPattern(e.target.value); setPage(0); }}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              <option value="">All Patterns</option>
              {patterns.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Problems List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr className="text-left text-gray-400 text-sm">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4 hidden md:table-cell">Pattern</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4 hidden lg:table-cell">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-gray-750 transition">
                  <td className="px-6 py-4">
                    {problem.progress?.optimalCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : problem.progress?.bruteCompleted || problem.progress?.improvedCompleted ? (
                      <div className="h-5 w-5 rounded-full border-2 border-yellow-500 flex items-center justify-center">
                        <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-gray-600" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Link 
                      to={`/problems/${problem.slug}`}
                      className="text-white hover:text-blue-400 transition font-medium"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="px-2 py-1 bg-gray-700 rounded text-sm text-gray-300">
                      {problem.patternTag}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <div className="flex space-x-2">
                      <div className="flex items-center space-x-1" title="Brute Force">
                        {getProgressIcon(problem.progress?.bruteCompleted)}
                        <span className="text-xs text-gray-500">B</span>
                      </div>
                      <div className="flex items-center space-x-1" title="Improved">
                        {getProgressIcon(problem.progress?.improvedCompleted)}
                        <span className="text-xs text-gray-500">I</span>
                      </div>
                      <div className="flex items-center space-x-1" title="Optimal">
                        {getProgressIcon(problem.progress?.optimalCompleted)}
                        <span className="text-xs text-gray-500">O</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {problems.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No problems found. Try adjusting your filters.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-400">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ProblemsPage;
