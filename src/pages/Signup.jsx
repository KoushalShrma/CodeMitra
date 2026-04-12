import { SignUp } from '@clerk/clerk-react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthRoleSwitch from '../components/auth/AuthRoleSwitch';

function Signup() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('as') === 'organization' ? 'organization' : 'user';

  return (
    <section className="auth-shell fade-slide-in">
      <div className="auth-card">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Join CodeMitra
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-text">Create your account</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Choose how you want to continue: user, organization, or admin.
        </p>

        <AuthRoleSwitch mode="signup" activeRole={mode} />

        {mode === 'organization' ? (
          <div className="mt-6" style={{ display: 'grid', gap: '0.75rem' }}>
            <p className="text-sm text-brand-muted">
              Organization onboarding uses a dedicated request form reviewed by a super admin.
            </p>
            <Link to="/institute-signup" className="ui-button ui-button-primary" style={{ justifyContent: 'center' }}>
              Continue as Organization
            </Link>
          </div>
        ) : (
          <div className="mt-6">
            <SignUp
              path="/signup"
              routing="path"
              signInUrl="/login"
              forceRedirectUrl="/dashboard"
            />
          </div>
        )}
      </div>
    </section>
  );
}

export default Signup;
