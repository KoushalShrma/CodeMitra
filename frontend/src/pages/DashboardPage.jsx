import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  Trophy, Target, Flame, BookOpen, CheckCircle, 
  TrendingUp, Award, Clock, Code2
} from 'lucide-react';
import { getStudentDashboard } from '../services/api';

function DashboardPage() {
  const { user } = useUser();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await getStudentDashboard();
      if (response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Use mock data for demo
      setDashboard({
        problemsSolved: 15,
        bruteCount: 15,
        improvedCount: 10,
        optimalCount: 5,
        currentStreak: 7,
        longestStreak: 14,
        totalTestsTaken: 3,
        averageTestScore: 85.5,
        patternProgress: {
          'Arrays': { solved: 5, total: 20, percentage: 25 },
          'Strings': { solved: 3, total: 15, percentage: 20 },
          'Linked Lists': { solved: 2, total: 10, percentage: 20 },
          'Trees': { solved: 2, total: 12, percentage: 16.7 },
          'Dynamic Programming': { solved: 1, total: 25, percentage: 4 },
          'Graphs': { solved: 2, total: 18, percentage: 11.1 },
        },
        recentSubmissions: [
          { problemId: 1, problemTitle: 'Two Sum', stageType: 'OPTIMAL', status: 'PASSED', language: 'Python', createdAt: '2024-01-15T10:30:00' },
          { problemId: 2, problemTitle: 'Valid Parentheses', stageType: 'BRUTE', status: 'PASSED', language: 'JavaScript', createdAt: '2024-01-14T15:45:00' },
          { problemId: 3, problemTitle: 'Maximum Subarray', stageType: 'IMPROVED', status: 'FAILED', language: 'Python', createdAt: '2024-01-14T14:20:00' },
        ],
        badges: [
          { name: 'First Blood', description: 'Solved your first problem', iconUrl: '🏆' },
          { name: 'Streak Master', description: '7 day coding streak', iconUrl: '🔥' },
          { name: 'Array Expert', description: 'Completed 5 array problems', iconUrl: '📊' },
        ]
      });
    } finally {
      setLoading(false);
    }
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
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || 'Coder'}! 👋
        </h1>
        <p className="text-gray-400">
          Track your progress and continue your coding journey.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Target className="h-6 w-6 text-blue-500" />}
          label="Problems Solved"
          value={dashboard?.problemsSolved || 0}
          color="blue"
        />
        <StatCard
          icon={<Flame className="h-6 w-6 text-orange-500" />}
          label="Current Streak"
          value={`${dashboard?.currentStreak || 0} days`}
          color="orange"
        />
        <StatCard
          icon={<Trophy className="h-6 w-6 text-yellow-500" />}
          label="Avg Test Score"
          value={`${dashboard?.averageTestScore?.toFixed(1) || 0}%`}
          color="yellow"
        />
        <StatCard
          icon={<Award className="h-6 w-6 text-purple-500" />}
          label="Badges Earned"
          value={dashboard?.badges?.length || 0}
          color="purple"
        />
      </div>

      {/* Stage Progress */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span>Stage Progress</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <StageProgressCard
            label="Brute Force"
            count={dashboard?.bruteCount || 0}
            color="red"
          />
          <StageProgressCard
            label="Improved"
            count={dashboard?.improvedCount || 0}
            color="yellow"
          />
          <StageProgressCard
            label="Optimal"
            count={dashboard?.optimalCount || 0}
            color="green"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pattern Progress */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <span>Pattern Progress</span>
          </h2>
          <div className="space-y-4">
            {dashboard?.patternProgress && Object.entries(dashboard.patternProgress).map(([pattern, data]) => (
              <div key={pattern}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{pattern}</span>
                  <span className="text-gray-400">{data.solved}/{data.total}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span>Recent Activity</span>
          </h2>
          <div className="space-y-3">
            {dashboard?.recentSubmissions?.map((submission, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded ${
                    submission.status === 'PASSED' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {submission.status === 'PASSED' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Code2 className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{submission.problemTitle}</p>
                    <p className="text-xs text-gray-400">
                      {submission.stageType} • {submission.language}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  submission.status === 'PASSED' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {submission.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges */}
      {dashboard?.badges && dashboard.badges.length > 0 && (
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <span>Your Badges</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dashboard.badges.map((badge, idx) => (
              <div key={idx} className="text-center p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition">
                <div className="text-4xl mb-2">{badge.iconUrl}</div>
                <p className="font-medium text-sm">{badge.name}</p>
                <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg bg-${color}-500/20`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StageProgressCard({ label, count, color }) {
  const colorClasses = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm opacity-80">{label} Solutions</p>
    </div>
  );
}

export default DashboardPage;
