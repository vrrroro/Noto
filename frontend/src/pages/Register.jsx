import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { authErrorMessage } from '../services/auth.js';
import { PASSWORD_RULES, isValidEmail, passwordMeetsRules } from '../utils/password.js';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email.trim())) return setError('Enter a valid email address.');
    if (!passwordMeetsRules(password)) return setError('Your password does not meet all the requirements.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    setError('');
    try {
      await signUp(email, password);
      navigate('/confirm', {
        state: { email: email.trim(), message: 'We sent a 6-digit verification code to your email.' },
      });
    } catch (err) {
      setError(authErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      label="Step 1 of 2"
      title={
        <>
          Create your <em>account</em>
        </>
      }
      subtitle="Keep every assignment and set of notes in one place."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-rules"
            required
          />
          <ul className="password-rules" id="password-rules">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li key={rule.label} className={met ? 'is-met' : ''}>
                  <Icon name={met ? 'check' : 'close'} size={14} />
                  {rule.label}
                  <span className="visually-hidden">{met ? ' (done)' : ' (not yet)'}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="field">
          <label htmlFor="register-confirm">Confirm password</label>
          <input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  );
}
