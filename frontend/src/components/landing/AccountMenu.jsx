import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../Icon.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';

export const APP_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/assignments', label: 'Assignments' },
  { to: '/subjects', label: 'Subjects' },
  { to: '/notes', label: 'Notes' },
];

// The account's initial: from its name, else its email.
export const initialOf = (user) => (user?.name || user?.email || '?').trim()[0]?.toUpperCase() || '?';

// For a signed-in visitor, in place of "Sign in" and "Create account": a
// "Signed in" pill with the account's initial in a circle. It opens a small
// menu with the app's pages and Sign out; Escape, a click outside or a pick
// closes it.
export default function AccountMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="l-account" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="l-account-btn l-underglow"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="l-account-label">Signed in</span>
        <span className="l-account-avatar" aria-hidden="true">
          {initialOf(user)}
        </span>
        <span className="visually-hidden">as {user?.name || user?.email}. Open account menu</span>
      </button>
      {open && (
        <div id={menuId} className="l-account-menu">
          <p className="l-account-who" title={user?.email}>
            {user?.name && <strong>{user.name}</strong>}
            <span>{user?.email}</span>
          </p>
          <ul>
            {APP_LINKS.map((link) => (
              <li key={link.to}>
                <Link className="l-account-item" to={link.to} onClick={() => setOpen(false)}>
                  {link.label}
                  <Icon name="arrowRight" size={16} />
                </Link>
              </li>
            ))}
          </ul>
          <button type="button" className="l-account-item is-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
