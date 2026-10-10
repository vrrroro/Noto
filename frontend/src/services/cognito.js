// Minimal Amazon Cognito client using the public Cognito Identity Provider
// API directly with fetch (no SDK needed). These operations only need the
// app client ID, which is not a secret. Passwords are sent over HTTPS to
// Cognito and are never stored by this application.
import { config } from '../config.js';

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

async function call(action, payload) {
  let res;
  try {
    res = await fetch(`https://cognito-idp.${config.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthError('NetworkError', 'Network error');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = String(data.__type || 'UnknownError').split('#').pop();
    throw new AuthError(code, data.message || code);
  }
  return data;
}

export const cognito = {
  // `name` is Cognito's standard attribute: no change to the user pool needed.
  signUp: (email, password, name) =>
    call('SignUp', {
      ClientId: config.clientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }, ...(name ? [{ Name: 'name', Value: name }] : [])],
    }),

  // Sets the signed-in user's own name (needs their access token only).
  updateName: (accessToken, name) =>
    call('UpdateUserAttributes', { AccessToken: accessToken, UserAttributes: [{ Name: 'name', Value: name }] }),

  confirmSignUp: (email, code) =>
    call('ConfirmSignUp', { ClientId: config.clientId, Username: email, ConfirmationCode: code }),

  resendConfirmationCode: (email) => call('ResendConfirmationCode', { ClientId: config.clientId, Username: email }),

  // Password reset: Cognito emails a code to the account's verified address. For an
  // unknown email it pretends to send one (the pool prevents user-existence leaks).
  forgotPassword: (email) => call('ForgotPassword', { ClientId: config.clientId, Username: email }),

  confirmForgotPassword: (email, code, password) =>
    call('ConfirmForgotPassword', { ClientId: config.clientId, Username: email, ConfirmationCode: code, Password: password }),

  async signIn(email, password) {
    const data = await call('InitiateAuth', {
      ClientId: config.clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });
    if (!data.AuthenticationResult) throw new AuthError('UnsupportedChallenge', data.ChallengeName || 'Challenge');
    return data.AuthenticationResult;
  },

  async refresh(refreshToken) {
    const data = await call('InitiateAuth', {
      ClientId: config.clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: { REFRESH_TOKEN: refreshToken },
    });
    return data.AuthenticationResult;
  },

  // Revokes the refresh token so a stolen copy can no longer create sessions.
  revokeToken: (refreshToken) => call('RevokeToken', { ClientId: config.clientId, Token: refreshToken }),
};
