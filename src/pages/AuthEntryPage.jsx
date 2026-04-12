import { Building2, ShieldCheck, User } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { getAdminSessionToken } from '../utils/adminSession';
import { getInstitutionSessionToken } from '../utils/institutionSession';

const ROLE_CARDS = [
  {
    key: 'student',
    title: 'Student',
    description: 'Practice problems, attempt tests, and track coding progress.',
    loginHref: '/login?as=user',
    signupHref: '/signup?as=user',
    icon: User,
  },
  {
    key: 'organization',
    title: 'Institute / Organization',
    description: 'Request onboarding, manage coding tests, and review analytics.',
    loginHref: '/institution/login',
    signupHref: '/institute-signup',
    icon: Building2,
  },
  {
    key: 'admin',
    title: 'Admin',
    description: 'Review institution requests and operate platform administration.',
    loginHref: '/admin/login',
    signupHref: '',
    icon: ShieldCheck,
  },
];

function AuthEntryPage() {
  const hasAdminSession = Boolean(getAdminSessionToken());
  const hasInstitutionSession = Boolean(getInstitutionSessionToken());

  if (hasAdminSession) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (hasInstitutionSession) {
    return <Navigate to="/institution/dashboard" replace />;
  }

  return (
    <section className="auth-shell fade-slide-in">
      <div className="auth-card" style={{ display: 'grid', gap: '1rem' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Welcome to CodeMitra
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-text">Choose your role</h1>
        <p className="text-sm text-brand-muted">
          Register if you are new, or login if you already have an account.
        </p>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {ROLE_CARDS.map((role) => {
            const Icon = role.icon;

            return (
              <article
                key={role.key}
                className="surface-elevated"
                style={{ display: 'grid', gap: '0.6rem', padding: '0.9rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <Icon size={18} />
                  <h2 style={{ margin: 0, fontSize: '1rem' }}>{role.title}</h2>
                </div>

                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {role.description}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Link to={role.loginHref} className="ui-button ui-button-primary">
                    Login
                  </Link>
                  {role.signupHref ? (
                    <Link to={role.signupHref} className="ui-button ui-button-secondary">
                      Register
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                      Admin registration is managed internally.
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default AuthEntryPage;
