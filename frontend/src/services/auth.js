// Authentication service used by the UI. In AWS mode it talks to Cognito;
// in demo mode it uses a local, browser-only user list.
import { isDemoMode } from '../config.js';
import { cognito, AuthError } from './cognito.js';
import { demoAuth } from './demo/demoAuth.js';
import { readJson, writeJson, removeKey } from '../utils/storage.js';

export { AuthError };

const SESSION_KEY = 'scm.session';
const REFRESH_MARGIN_MS = 60 * 1000;

const MESSAGES = {
  UsernameExistsException: 'An account with this email already exists.',
  NotAuthorizedException: 'Incorrect email or password.',
  UserNotFoundException: 'Incorrect email or password.',
  UserNotConfirmedException: 'Please verify your email before signing in.',
  CodeMismatchException: 'That verification code is incorrect.',
  ExpiredCodeException: 'That code has expired. Request a new one.',
  InvalidParameterException: 'Please check the details you entered.',
  LimitExceededException: 'Too many attempts. Please wait a few minutes and try again.',
  TooManyRequestsException: 'Too many attempts. Please wait a few minutes and try again.',
  TooManyFailedAttemptsException: 'Too many attempts. Please wait a few minutes and try again.',
  NetworkError: 'Could not reach the sign-in service. Check your internet connection.',
  UnsupportedChallenge: 'This account needs an action that the app does not support. Contact the administrator.',
};

export function authErrorMessage(err) {
  // Password reset needs a verified email; an account that never entered its sign-up code has none.
  if (err?.code === 'InvalidParameterException' && /verified email/i.test(err.message || '')) {
    return 'This account has not verified its email yet. Sign in to finish verifying it first.';
  }
  if (err?.code === 'InvalidPasswordException') {
    const detail = String(err.message || '').split(':').pop().trim();
    return `Password does not meet the requirements${detail ? `: ${detail}` : '.'}`;
  }
  return MESSAGES[err?.code] || 'Something went wrong. Please try again.';
}

function decodeJwt(token) {
  const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = new TextDecoder().decode(Uint8Array.from(atob(payload), (c) => c.charCodeAt(0)));
  return JSON.parse(json);
}

function sessionFromTokens(result, previous = {}) {
  const claims = decodeJwt(result.IdToken);
  return {
    email: claims.email,
    name: claims.name || '',
    userId: claims.sub,
    idToken: result.IdToken,
    accessToken: result.AccessToken,
    refreshToken: result.RefreshToken || previous.refreshToken, // refresh responses omit it
    expiresAt: Date.now() + result.ExpiresIn * 1000,
  };
}

const cognitoAuth = {
  signUp: (email, password, name) => cognito.signUp(email, password, name),
  confirmSignUp: (email, code) => cognito.confirmSignUp(email, code),
  resendCode: (email) => cognito.resendConfirmationCode(email),
  forgotPassword: (email) => cognito.forgotPassword(email),
  confirmForgotPassword: (email, code, password) => cognito.confirmForgotPassword(email, code, password),

  async signIn(email, password) {
    const session = sessionFromTokens(await cognito.signIn(email, password));
    writeJson(SESSION_KEY, session);
    return session;
  },

  async signOut() {
    const session = readJson(SESSION_KEY);
    removeKey(SESSION_KEY);
    if (session?.refreshToken) await cognito.revokeToken(session.refreshToken).catch(() => {});
  },

  getSession: () => readJson(SESSION_KEY),

  // Saves the name on the account, then refreshes the tokens so the session
  // (and the ID token's `name` claim) carries it.
  async updateName(name) {
    await cognito.updateName(await this.getAccessToken(), name);
    await this.getAccessToken({ forceRefresh: true });
    return readJson(SESSION_KEY);
  },

  // Returns a valid access token, refreshing it first if it is about to expire.
  async getAccessToken({ forceRefresh = false } = {}) {
    const session = readJson(SESSION_KEY);
    if (!session) throw new AuthError('SessionExpired', 'Not signed in');
    if (!forceRefresh && session.expiresAt - REFRESH_MARGIN_MS > Date.now()) return session.accessToken;

    try {
      const next = sessionFromTokens(await cognito.refresh(session.refreshToken), session);
      writeJson(SESSION_KEY, next);
      return next.accessToken;
    } catch {
      removeKey(SESSION_KEY);
      throw new AuthError('SessionExpired', 'Session expired');
    }
  },
};

export const auth = isDemoMode ? demoAuth : cognitoAuth;
