import Icon from './Icon.jsx';
import { dueStatus, formatDate } from '../utils/date.js';

const PRIORITY_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

export default function AssignmentCard({ assignment, color, onToggleComplete, onEdit, onDelete, busy }) {
  const { title, subject, dueDate, priority, description, completed } = assignment;
  const status = dueStatus(dueDate, completed);

  return (
    <article
      className={`assignment-card ${completed ? 'is-completed' : ''}`}
      style={{ '--subject': color }}
      aria-busy={busy || undefined}
    >
      <div className="assignment-main">
        <div className="assignment-title-row">
          <h3>{title}</h3>
          <span className={`badge badge-priority-${priority.toLowerCase()}`}>{PRIORITY_LABEL[priority]} priority</span>
        </div>
        <dl className="meta-list">
          <div>
            <dt>Subject</dt>
            <dd>
              <span className="chip">{subject}</span>
            </dd>
          </div>
          <div>
            <dt>Due</dt>
            <dd>
              <time dateTime={dueDate}>{formatDate(dueDate)}</time>
            </dd>
          </div>
        </dl>
        {description && <p className="assignment-description">{description}</p>}
        <span className={`status-pill tone-${status.tone}`}>
          <Icon name={completed ? 'check' : 'clock'} size={14} />
          {status.label}
        </span>
      </div>

      <div className="card-actions">
        <button
          type="button"
          className={`btn btn-sm btn-toggle ${completed ? 'is-on' : 'btn-success'}`}
          onClick={onToggleComplete}
          disabled={busy}
          aria-pressed={completed}
        >
          <span className="toggle" aria-hidden="true">
            <span className="toggle-knob" />
          </span>
          {completed ? 'Mark pending' : 'Complete'}
        </button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={onEdit} disabled={busy}>
          <Icon name="edit" size={16} /> Edit
        </button>
        <button type="button" className="btn btn-sm btn-ghost-danger" onClick={onDelete} disabled={busy}>
          <Icon name="trash" size={16} /> Delete
        </button>
      </div>
    </article>
  );
}
