import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../services/auth.js';
import { SESSION_EXPIRED_EVENT } from '../services/api.js';

const AuthContext = createContext(null);

const toUser = (session) => (session ? { email: session.email, name: session.name || '', userId: session.userId } : null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => toUser(auth.getSession()));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setNotice('Your session has expired. Please sign in again.');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const signIn = useCallback(async (email, password) => {
    const session = await auth.signIn(email.trim(), password);
    setNotice('');
    setUser(toUser(session));
  }, []);

  const updateName = useCallback(async (name) => {
    setUser(toUser(await auth.updateName(name.trim())));
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      notice,
      setNotice,
      signIn,
      signOut,
      updateName,
      signUp: (email, password, name = '') => auth.signUp(email.trim(), password, name.trim()),
      confirmSignUp: (email, code) => auth.confirmSignUp(email.trim(), code.trim()),
      resendCode: (email) => auth.resendCode(email.trim()),
      forgotPassword: (email) => auth.forgotPassword(email.trim()),
      confirmForgotPassword: (email, code, password) => auth.confirmForgotPassword(email.trim(), code.trim(), password),
    }),
    [user, notice, signIn, signOut, updateName],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
