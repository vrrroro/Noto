import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import Modal from './Modal.jsx';
import { initialOf } from './landing/AccountMenu.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from './Toast.jsx';

// The account in the sidebar: the initial and the name. Clicking it opens a
// small menu (upwards, as it sits at the foot of the sidebar): Rename, Home
// (the landing page) and Sign out. Escape or a click elsewhere closes it.
export default function AccountButton() {
  const { user, signOut, updateName } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
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

  function startRename() {
    setOpen(false);
    setName(user?.name || '');
    setRenaming(true);
  }

  async function saveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateName(name);
      toast.success('Name updated.');
      setRenaming(false);
    } catch (err) {
      toast.error(err.message || 'Could not save your name.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="account" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="user-box account-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar" aria-hidden="true">
          {initialOf(user)}
        </span>
        <span className="user-email" title={user?.email}>
          {user?.name || user?.email}
        </span>
        <Icon name="chevronDown" size={16} className="account-chevron" />
      </button>
      {open && (
        <div id={menuId} className="account-menu">
          <button type="button" className="account-item" onClick={startRename}>
            <Icon name="edit" size={16} />
            Rename
          </button>
          <Link to="/home" className="account-item" onClick={() => setOpen(false)}>
            <Icon name="arrowLeft" size={16} />
            Home
          </Link>
          <button type="button" className="account-item is-signout" onClick={handleSignOut}>
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      )}

      <Modal open={renaming} title="Rename" label="Your account" onClose={() => setRenaming(false)} size="sm">
        <form className="form" onSubmit={saveName}>
          <div className="field">
            <label htmlFor="rename-input">Name</label>
            <input
              id="rename-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={60}
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
