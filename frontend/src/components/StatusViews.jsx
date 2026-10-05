import Icon from './Icon.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-view" role="status">
      <LoadingSpinner />
      <p>{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry, label = 'Failed to load.' }) {
  return (
    <div className="state-view state-error" role="alert">
      <Icon name="alert" size={28} />
      <p className="state-title">{label}</p>
      {error?.message && <p className="text-muted">{error.message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          <Icon name="refresh" /> Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'file', title, children, action }) {
  return (
    <div className="state-view state-empty">
      <span className="state-icon">
        <Icon name={icon} size={26} />
      </span>
      <p className="state-title">{title}</p>
      {children && <p className="text-muted">{children}</p>}
      {action}
    </div>
  );
}
