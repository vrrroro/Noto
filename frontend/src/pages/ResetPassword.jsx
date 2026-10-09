import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { authErrorMessage } from '../services/auth.js';
import { isDemoMode } from '../config.js';
import { PASSWORD_RULES, isValidEmail, passwordMeetsRules } from '../utils/password.js';

// Forgotten password, in two steps on one page:
//   1. the email address -> Cognito emails a 6-digit code (ForgotPassword);
//   2. the code and a new password -> Cognito sets it (ConfirmForgotPassword),
//      then back to sign in.
// Cognito answers step 1 the same way whether or not the account exists, so the
// page never reveals which emails have accounts.
export default function ResetPassword() {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    if (!isValidEmail(email.trim())) return setError('Enter a valid email address.');
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setInfo('If an account exists for that email, a 6-digit code is on its way. Check your inbox (and spam folder).');
      setStep('confirm');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code from the email.');
    if (!passwordMeetsRules(password)) return setError('Your new password does not meet all the requirements.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    setError('');
    try {
      await confirmForgotPassword(email, code, password);
      navigate('/login', {
        replace: true,
        state: { email: email.trim(), message: 'Password changed. Sign in with your new password.' },
      });
    } catch (err) {
      setError(authErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    try {
      await forgotPassword(email);
      setInfo('A new code is on its way.');
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <AuthLayout
      label={step === 'request' ? 'Reset password' : 'Step 2 of 2'}
      title={
        step === 'request' ? (
          <>
            Forgot your <em>password?</em>
          </>
        ) : (
          <>
            Choose a new <em>password</em>
          </>
        )
      }
      subtitle={
        step === 'request'
          ? 'Enter your email and we will send you a code to reset it.'
          : `Enter the code we sent to ${email.trim()} and your new password.`
      }
      footer={
        <>
          Remembered it? <Link to="/login">Back to sign in</Link>
        </>
      }
    >
      {info && !error && <p className="alert alert-success">{info}</p>}
      {isDemoMode && step === 'confirm' && (
        <p className="field-hint">Demo mode: any 6-digit code (for example 123456) works.</p>
      )}
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      {step === 'request' ? (
        <form className="form" onSubmit={handleRequest} noValidate>
          <div className="field">
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset code'}
          </button>
        </form>
      ) : (
        <form className="form" onSubmit={handleConfirm} noValidate>
          <div className="field">
            <label htmlFor="reset-code">Reset code</label>
            <input
              id="reset-code"
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
          <div className="field">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="reset-password-rules"
              required
            />
            <ul className="password-rules" id="reset-password-rules">
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
            <label htmlFor="reset-confirm">Confirm new password</label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Saving…' : 'Set new password'}
          </button>
          <button type="button" className="btn btn-link" onClick={handleResend}>
            Resend code
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
