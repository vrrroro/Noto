import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

// Unauthenticated users are sent to the login page, except on the home page,
// where they see `guest` (the landing page) instead. This is a UX guard only:
// the real security boundary is the API (Cognito JWT + ownership checks).
export function ProtectedRoute({ guest }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    if (guest && location.pathname === '/') return guest;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

// Signed-in users have no reason to see the login/register pages.
export function PublicOnlyRoute() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <Outlet />;
}
