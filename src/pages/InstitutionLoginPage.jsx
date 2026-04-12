import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { institutionLogin } from '../services/apiClient';
import {
  clearInstitutionSession,
  getInstitutionSessionToken,
  setInstitutionSession,
} from '../utils/institutionSession';

function InstitutionLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = getInstitutionSessionToken();
    if (token) {
      navigate('/institution/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = await institutionLogin({ email, password });
      setInstitutionSession({
        token: payload?.token || '',
        institution: payload?.institution || null,
      });
      navigate('/institution/dashboard', { replace: true });
    } catch (error) {
      clearInstitutionSession();
      setErrorMessage(error instanceof Error ? error.message : 'Unable to continue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-container" style={{ maxWidth: 560, marginInline: 'auto' }}>
      <section
        className="surface-card"
        style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)' }}
      >
        <p className="label-text">Institution Portal</p>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Institution Sign In</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Sign in with your institution credentials sent by CodeMitra after request approval.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="ui-input"
            type="email"
            placeholder="Institution login email"
            required
          />

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="ui-input"
            type="password"
            placeholder="Password"
            required
          />

          {errorMessage ? (
            <p style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{errorMessage}</p>
          ) : null}

          <button type="submit" className="ui-button ui-button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
          New institution?{' '}
          <Link
            to="/institute-signup"
            style={{ color: 'var(--color-accent-primary)', fontWeight: 700 }}
          >
            Register your institute/organization here
          </Link>
          .
        </p>
      </section>
    </main>
  );
}

export default InstitutionLoginPage;