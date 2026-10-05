import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { authErrorMessage } from '../services/auth.js';
import { isDemoMode } from '../config.js';
import { isValidEmail } from '../utils/password.js';

export default function ConfirmAccount() {
  const { confirmSignUp, resendCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState(location.state?.message ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email.trim())) return setError('Enter a valid email address.');
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code from the email.');

    setLoading(true);
    setError('');
    try {
      await confirmSignUp(email, code);
      navigate('/login', { replace: true, state: { email: email.trim(), message: 'Email verified. You can sign in now.' } });
    } catch (err) {
      setError(authErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!isValidEmail(email.trim())) return setError('Enter your email address first.');
    setError('');
    try {
      await resendCode(email);
      setInfo('A new code is on its way. Check your inbox (and spam folder).');
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the verification code to activate your account."
      footer={
        <>
          Back to <Link to="/login">sign in</Link>
        </>
      }
    >
      {info && !error && <p className="alert alert-success">{info}</p>}
      {isDemoMode && <p className="field-hint">Demo mode: any 6-digit code (for example 123456) works.</p>}
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="confirm-email">Email</label>
          <input
            id="confirm-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirm-code">Verification code</label>
          <input
            id="confirm-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="code-input"
            required
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify email'}
        </button>
        <button type="button" className="btn btn-link" onClick={handleResend}>
          Resend code
        </button>
      </form>
    </AuthLayout>
  );
}
