import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/apiClient';
import { getAdminSessionToken, setAdminSession } from '../utils/adminSession';

function AdminLoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = getAdminSessionToken();
    if (token) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = await adminLogin({ identifier, password });

      setAdminSession({
        token: payload?.token || '',
        admin: payload?.admin || null,
      });

      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to continue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-container" style={{ maxWidth: 560, marginInline: 'auto' }}>
      <section className="surface-card" style={{ padding: 'var(--space-6)', display: 'grid', gap: 'var(--space-3)' }}>
        <p className="label-text">Super Admin Portal</p>
        <h1 style={{ fontSize: 'var(--text-2xl)' }}>Admin Sign In</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Use backend-managed admin credentials to review institution onboarding requests.
        </p>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
          Default bootstrap admin: username <strong>koushal</strong> or email <strong>koushal@codemitra.com</strong> with password <strong>123</strong>.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="ui-input"
            placeholder="Username or email"
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
      </section>
    </main>
  );
}

export default AdminLoginPage;
