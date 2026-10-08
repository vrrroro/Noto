import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ConfirmAccount from './pages/ConfirmAccount.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Assignments from './pages/Assignments.jsx';
import Notes from './pages/Notes.jsx';
import Subjects from './pages/Subjects.jsx';
import NotFound from './pages/NotFound.jsx';

// The landing page is its own chunk: signed-in users never download it.
const Landing = lazy(() => import('./pages/Landing.jsx'));
const landing = (
  <Suspense fallback={null}>
    <Landing />
  </Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/confirm" element={<ConfirmAccount />} />
            </Route>
            <Route element={<ProtectedRoute guest={landing} />}>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="/assignments" element={<Assignments />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
