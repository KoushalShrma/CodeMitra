import { SignIn, SignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const location = useLocation();
  const { isSignedIn, isLoaded } = useAuth();

  // Redirect if already signed in
  if (isLoaded && isSignedIn) {
    const from = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-gray-400">
            {isSignUp 
              ? 'Start your coding journey with CodeMitra' 
              : 'Sign in to continue your progress'}
          </p>
        </div>

        {/* Clerk Sign In/Up Component */}
        <div className="flex justify-center">
          {isSignUp ? (
            <SignUp 
              routing="hash"
              signInUrl="/login"
              afterSignUpUrl="/profile"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-gray-800 border border-gray-700',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-gray-400',
                  socialButtonsBlockButton: 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600',
                  formFieldLabel: 'text-gray-300',
                  formFieldInput: 'bg-gray-700 border-gray-600 text-white',
                  footerActionLink: 'text-blue-400 hover:text-blue-300',
                  identityPreviewText: 'text-white',
                  identityPreviewEditButton: 'text-blue-400'
                }
              }}
            />
          ) : (
            <SignIn 
              routing="hash"
              signUpUrl="/login"
              afterSignInUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-gray-800 border border-gray-700',
                  headerTitle: 'text-white',
                  headerSubtitle: 'text-gray-400',
                  socialButtonsBlockButton: 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600',
                  formFieldLabel: 'text-gray-300',
                  formFieldInput: 'bg-gray-700 border-gray-600 text-white',
                  footerActionLink: 'text-blue-400 hover:text-blue-300',
                  identityPreviewText: 'text-white',
                  identityPreviewEditButton: 'text-blue-400'
                }
              }}
            />
          )}
        </div>

        {/* Toggle between Sign In and Sign Up */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
