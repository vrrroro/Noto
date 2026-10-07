import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { authErrorMessage } from '../services/auth.js';
import { isValidEmail } from '../utils/password.js';

export default function Login() {
  const { signIn, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const info = location.state?.message || notice;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');

    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      if (err.code === 'UserNotConfirmedException') {
        navigate('/confirm', { state: { email: email.trim(), message: 'Please verify your email to finish signing up.' } });
        return;
      }
      setError(authErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={
        <>
          Welcome <em>back</em>
        </>
      }
      subtitle="Sign in to see your assignments and notes."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      {info && !error && <p className="alert alert-success">{info}</p>}
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
