import { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('If this email exists, reset instructions have been sent.');
    setEmail('');
  };

  return (
    <section className="auth-shell fade-slide-in">
      <div className="auth-card">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
          Account Recovery
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-brand-text">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Enter your email and we will send password reset instructions.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="recovery-email"
              className="mb-1.5 block text-sm font-medium text-brand-muted"
            >
              Email
            </label>
            <input
              id="recovery-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="form-input"
              placeholder="Enter your email"
            />
          </div>

          <button type="submit" className="form-button">
            Send Reset Link
          </button>
        </form>

        {message ? <p className="status-success">{message}</p> : null}

        <p className="mt-5 text-center text-sm text-brand-muted">
          Remembered your password?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-accent transition hover:text-brand-accentSoft"
          >
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default ForgotPassword;
