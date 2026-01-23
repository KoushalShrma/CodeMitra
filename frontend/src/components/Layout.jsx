import { Outlet, Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useAuth } from '@clerk/clerk-react';
import { Code2, Home, BookOpen, Trophy, ClipboardList, LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { setAuthToken } from '../services/api';

function Layout() {
  const { getToken, isSignedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const setupAuth = async () => {
      if (isSignedIn) {
        try {
          const token = await getToken();
          setAuthToken(token);
        } catch (error) {
          console.error('Error getting token:', error);
        }
      } else {
        setAuthToken(null);
      }
    };

    setupAuth();
  }, [isSignedIn, getToken]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <Code2 className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold">CodeMitra</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link
                to="/problems"
                className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition"
              >
                <BookOpen className="h-4 w-4" />
                <span>Problems</span>
              </Link>
              
              <SignedIn>
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition"
                >
                  <Trophy className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/tests"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span>Tests</span>
                </Link>
              </SignedIn>
            </div>

            {/* Auth */}
            <div className="flex items-center space-x-4">
              <SignedOut>
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'h-10 w-10'
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Code2 className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-semibold">CodeMitra</span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} CodeMitra. Learn to think, not just code.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
