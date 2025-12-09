import { Link } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Code2, BookOpen, Brain, Trophy, ArrowRight, CheckCircle } from 'lucide-react';

function HomePage() {
  const features = [
    {
      icon: <Brain className="h-8 w-8 text-blue-500" />,
      title: 'Learn to Think',
      description: 'Progress from Brute Force → Improved → Optimal solutions. Understand the WHY behind each approach.'
    },
    {
      icon: <BookOpen className="h-8 w-8 text-green-500" />,
      title: 'Pattern-Based Learning',
      description: 'Problems organized by coding patterns like Arrays, Two Pointers, Sliding Window, DP, and more.'
    },
    {
      icon: <Code2 className="h-8 w-8 text-purple-500" />,
      title: 'AI-Powered Hints',
      description: 'Get contextual hints that guide your thinking, not just give away solutions.'
    },
    {
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
      title: 'Track Progress',
      description: 'Gamified dashboard with streaks, badges, and pattern-wise progress tracking.'
    }
  ];

  const stages = [
    { name: 'Brute Force', color: 'bg-red-500', description: 'Start with the simplest approach' },
    { name: 'Improved', color: 'bg-yellow-500', description: 'Optimize time or space complexity' },
    { name: 'Optimal', color: 'bg-green-500', description: 'Achieve the best possible solution' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6">
              <span className="text-white">Learn to </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                Think Like a Developer
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              CodeMitra is an AI-powered coding education platform that teaches you 
              problem-solving patterns, not just how to pass test cases.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/problems"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Start Solving
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <SignedOut>
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                >
                  Sign Up Free
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                >
                  View Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Stage Progression Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Master the <span className="text-blue-500">Three Stages</span> of Problem Solving
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {stages.map((stage, index) => (
              <div key={stage.name} className="relative">
                <div className="bg-gray-700 rounded-lg p-6 text-center">
                  <div className={`${stage.color} w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl`}>
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{stage.name}</h3>
                  <p className="text-gray-400">{stage.description}</p>
                </div>
                {index < stages.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why CodeMitra?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Level Up Your Coding Skills?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students learning to think algorithmically.
          </p>
          <Link
            to="/problems"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-bold text-lg"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
