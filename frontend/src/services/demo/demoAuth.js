// Demo-mode authentication. Accounts live only in this browser's
// localStorage. Passwords are never stored: only a salted SHA-256 hash is
// kept so that "wrong password" can be demonstrated. In AWS mode, Cognito
// handles all of this instead.
import { AuthError } from '../cognito.js';
import { readJson, writeJson, removeKey } from '../../utils/storage.js';
import { passwordMeetsRules } from '../../utils/password.js';
import { getDemoBackend, DEMO_TOKEN_PREFIX } from './demoBackend.js';

const USERS_KEY = 'scm.demo.users';
const SESSION_KEY = 'scm.demo.session';

async function hashPassword(email, password) {
  const bytes = new TextEncoder().encode(`scm-demo:${email}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const normalize = (email) => email.trim().toLowerCase();
const users = () => readJson(USERS_KEY, {});

export const demoAuth = {
  async signUp(email, password) {
    const key = normalize(email);
    const all = users();
    if (all[key]) throw new AuthError('UsernameExistsException', 'exists');
    if (!passwordMeetsRules(password)) throw new AuthError('InvalidPasswordException', 'Password did not conform with policy');
    all[key] = { userId: crypto.randomUUID(), passwordHash: await hashPassword(key, password), confirmed: false, seeded: false };
    writeJson(USERS_KEY, all);
  },

  // Any 6-digit code is accepted in demo mode (Cognito would email a real one).
  async confirmSignUp(email, code) {
    const all = users();
    const user = all[normalize(email)];
    if (!user) throw new AuthError('UserNotFoundException', 'missing');
    if (!/^\d{6}$/.test(code)) throw new AuthError('CodeMismatchException', 'bad code');
    user.confirmed = true;
    writeJson(USERS_KEY, all);
  },

  async resendCode() {},

  // Like Cognito, "sends" a code without revealing whether the account exists.
  async forgotPassword() {},

  // Any 6-digit code is accepted in demo mode; the new password must meet the policy.
  async confirmForgotPassword(email, code, password) {
    const all = users();
    const key = normalize(email);
    const user = all[key];
    if (!user || !/^\d{6}$/.test(code)) throw new AuthError('CodeMismatchException', 'bad code');
    if (!passwordMeetsRules(password)) throw new AuthError('InvalidPasswordException', 'Password did not conform with policy');
    user.passwordHash = await hashPassword(key, password);
    writeJson(USERS_KEY, all);
  },

  async signIn(email, password) {
    const key = normalize(email);
    const all = users();
    const user = all[key];
    if (!user || user.passwordHash !== (await hashPassword(key, password))) {
      throw new AuthError('NotAuthorizedException', 'bad credentials');
    }
    if (!user.confirmed) throw new AuthError('UserNotConfirmedException', 'not confirmed');

    if (!user.seeded) {
      await getDemoBackend().seed(user.userId);
      user.seeded = true;
      writeJson(USERS_KEY, all);
    }

    const session = { email: key, userId: user.userId };
    writeJson(SESSION_KEY, session);
    return session;
  },

  async signOut() {
    removeKey(SESSION_KEY);
  },

  getSession: () => readJson(SESSION_KEY),

  async getAccessToken() {
    const session = readJson(SESSION_KEY);
    if (!session) throw new AuthError('SessionExpired', 'Not signed in');
    return DEMO_TOKEN_PREFIX + session.userId;
  },
};
