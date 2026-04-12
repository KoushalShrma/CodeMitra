import { SignIn } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import AuthRoleSwitch from '../components/auth/AuthRoleSwitch';

function Login() {
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('as');

  if (requestedMode === 'organization') {
    return <Navigate to="/institution/login" replace />;
  }

  const title = 'Sign in to CodeMitra';
  const subtitle = 'Use your account to continue your coding journey.';

  return (
    <section className="auth-shell fade-slide-in">
      <div className="auth-card">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Secure Sign In
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-text">{title}</h1>
        <p className="mt-2 text-sm text-brand-muted">{subtitle}</p>

        <AuthRoleSwitch mode="login" activeRole="user" />

        {/*
          Clerk renders OAuth providers (including Google) directly in this SignIn component.
          Once Google OAuth is enabled in Clerk dashboard, Gmail sign-in appears automatically.
        */}
        <div className="mt-6">
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/signup"
            forceRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </section>
  );
}

export default Login;
