import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function Layout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <main id="main" className="main" tabIndex={-1}>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
