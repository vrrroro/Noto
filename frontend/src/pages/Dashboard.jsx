import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { NotoWord } from '../components/NotoWord.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusViews.jsx';
import { useToast } from '../components/Toast.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useResource } from '../hooks/useResource.js';
import { assignmentsApi, filesApi, subjectsApi } from '../services/api.js';
import { daysUntil, dueStatus, formatDateTime, formatShortDate } from '../utils/date.js';
import { fileExtension, formatBytes, greetingName, subjectColors } from '../utils/format.js';

const UPCOMING_LIMIT = 5;
const RECENT_FILES_LIMIT = 5;

// All dashboard numbers are calculated from the real API data.
export function summarize(assignments, files, now = new Date()) {
  const pending = assignments.filter((a) => !a.completed).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return {
    total: assignments.length,
    pending: pending.length,
    completed: assignments.length - pending.length,
    overdue: pending.filter((a) => daysUntil(a.dueDate, now) < 0).length,
    // The most urgent pending assignment: overdue work first, then the next deadline.
    next: pending[0] ?? null,
    upcoming: pending.filter((a) => daysUntil(a.dueDate, now) >= 0).slice(0, UPCOMING_LIMIT),
    recentFiles: [...files].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, RECENT_FILES_LIMIT),
  };
}

// A machined tray: an LED in the tone colour, a mono label and a huge number.
function StatTile({ label, value, tone }) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// The bar fills from 0 to the real completion figure once the data arrives.
function CompletionMeter({ completed, total }) {
  const percent = Math.round((completed / total) * 100);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);

  return (
    <div className="meter">
      <div
        className="meter-track"
        role="progressbar"
        aria-label="Assignments completed"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        style={{ '--meter': shown }}
      >
        <span className="meter-fill" />
        <span className="meter-dot" />
      </div>
      <p className="meter-label">
        <strong>{percent}%</strong> <span className="quiet">of assignments completed</span>
      </p>
    </div>
  );
}

// The page's one inverted card: the single most important action right now.
function NextUp({ next, total, colorOf, completing, onComplete }) {
  if (!next) {
    return (
      <section className="invert next-card" aria-labelledby="next-heading">
        <p className="label">Next up</p>
        <h2 id="next-heading" className="next-title">
          {total ? (
            <>
              <span>All caught up.</span> <span className="quiet">Nothing is waiting on you right now.</span>
            </>
          ) : (
            <>
              <span>Start with one assignment.</span> <span className="quiet">Add a deadline and <NotoWord /> keeps track of it.</span>
            </>
          )}
        </h2>
        <div className="next-actions">
          <Link to="/assignments?new=1" className="btn btn-primary btn-giant">
            New assignment
          </Link>
          <Link to="/notes" className="btn btn-secondary btn-giant">
            Upload notes
          </Link>
        </div>
      </section>
    );
  }

  const due = dueStatus(next.dueDate, false);
  return (
    <section className="invert next-card" aria-labelledby="next-heading">
      <div className="next-meta">
        <p className="label">Next up</p>
        <span className="chip" style={{ '--subject': colorOf(next.subject) }}>
          {next.subject}
        </span>
        <span className={`badge badge-priority-${next.priority.toLowerCase()}`}>{next.priority.toLowerCase()} priority</span>
      </div>
      <h2 id="next-heading" className="next-title">
        <span>{next.title}</span> <span className="quiet">is {due.label.toLowerCase()}.</span>
      </h2>
      <div className="next-actions">
        <button type="button" className="btn btn-primary btn-giant" onClick={onComplete} disabled={completing}>
          {completing ? 'Saving…' : 'Mark complete'}
        </button>
        <Link to="/assignments" className="btn btn-secondary btn-giant">
          See all assignments
        </Link>
      </div>
    </section>
  );
}

// Accounts made before sign-up asked for a name have none: ask once, here,
// and save it on the account (Cognito's `name`), never guess it from the email.
function NamePrompt() {
  const { updateName } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateName(name);
      toast.success('Saved. Nice to meet you.');
    } catch (err) {
      toast.error(err.message || 'Could not save your name.');
      setSaving(false);
    }
  }

  return (
    <form className="name-prompt" onSubmit={save}>
      <label htmlFor="name-prompt-input" className="name-prompt-label">
        What should we call you?
      </label>
      <input
        id="name-prompt-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoComplete="given-name"
        maxLength={60}
      />
      <button type="submit" className="btn btn-secondary btn-sm" disabled={saving || !name.trim()}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = greetingName(user?.name);
  const toast = useToast();
  const [completing, setCompleting] = useState(false);
  const { status, data, error, reload } = useResource(async () => {
    const [assignments, files, subjects] = await Promise.all([assignmentsApi.list(), filesApi.list(), subjectsApi.list()]);
    return { ...summarize(assignments, files), colorOf: subjectColors(subjects) };
  });

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  async function completeNext() {
    const { next } = data;
    setCompleting(true);
    try {
      await assignmentsApi.update(next.assignmentId, { completed: true });
      toast.success(`Marked “${next.title}” complete.`);
      await reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <>
      <PageHeader
        label={today}
        title={
          <>
            Hello, <em>{firstName || 'there'}</em>
          </>
        }
        actions={
          <>
            <Link to="/notes" className="btn btn-secondary">
              Upload notes
            </Link>
            <Link to="/assignments?new=1" className="btn btn-primary">
              New assignment
            </Link>
          </>
        }
      />

      {!firstName && <NamePrompt />}

      {status === 'loading' && <LoadingState label="Loading your dashboard…" />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} label="Failed to load the dashboard." />}

      {status === 'success' && (
        <>
          <section aria-labelledby="stats-heading" className="section">
            <h2 id="stats-heading" className="visually-hidden">
              Assignment summary
            </h2>
            <div className="stats-grid" data-reveal-cards>
              <StatTile label="Total" value={data.total} tone="neutral" />
              <StatTile label="Pending" value={data.pending} tone="warning" />
              <StatTile label="Completed" value={data.completed} tone="success" />
              <StatTile label="Overdue" value={data.overdue} tone="danger" />
            </div>
            {data.total > 0 && <CompletionMeter completed={data.completed} total={data.total} />}
          </section>

          <NextUp
            next={data.next}
            total={data.total}
            colorOf={data.colorOf}
            completing={completing}
            onComplete={completeNext}
          />

          <div className="band">
            <div className="dashboard-grid" data-reveal-cards>
              <section className="card" aria-labelledby="upcoming-heading">
                <div className="card-header">
                  <h2 id="upcoming-heading" className="card-title">
                    <span>Upcoming.</span> <span className="quiet">What is due next.</span>
                  </h2>
                  <Link to="/assignments" className="link-arrow">
                    All assignments <Icon name="arrowRight" size={16} />
                  </Link>
                </div>
                {data.upcoming.length === 0 ? (
                  <EmptyState icon="calendar" title="Nothing due soon">
                    {data.pending ? 'Only overdue work is left. Check your assignments.' : 'You are all caught up.'}
                  </EmptyState>
                ) : (
                  <ul className="list">
                    {data.upcoming.map((a) => {
                      const due = dueStatus(a.dueDate, false);
                      return (
                        <li key={a.assignmentId} className="list-row">
                          <span className="date-chip" style={{ '--subject': data.colorOf(a.subject) }}>
                            <span>{formatShortDate(a.dueDate).split(' ')[1]}</span>
                            <strong>{formatShortDate(a.dueDate).split(' ')[0]}</strong>
                          </span>
                          <span className="list-main">
                            <span className="list-title">{a.title}</span>
                            <span className="text-muted">{a.subject}</span>
                          </span>
                          <span className={`status-pill tone-${due.tone}`}>{due.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="card" aria-labelledby="files-heading">
                <div className="card-header">
                  <h2 id="files-heading" className="card-title">
                    <span>Recent files.</span> <span className="quiet">Latest uploads.</span>
                  </h2>
                  <Link to="/notes" className="link-arrow">
                    All notes <Icon name="arrowRight" size={16} />
                  </Link>
                </div>
                {data.recentFiles.length === 0 ? (
                  <EmptyState icon="notes" title="No files yet">
                    Upload lecture notes or assignment PDFs to find them here.
                  </EmptyState>
                ) : (
                  <ul className="list">
                    {data.recentFiles.map((f) => (
                      <li key={f.fileId} className="list-row">
                        <span className={`file-type file-type-sm file-type-${fileExtension(f.fileName)}`} aria-hidden="true">
                          {fileExtension(f.fileName).toUpperCase().slice(0, 4)}
                        </span>
                        <span className="list-main">
                          <span className="list-title">{f.fileName}</span>
                          <span className="text-muted">
                            {f.subject}, {formatBytes(f.fileSize)}
                          </span>
                        </span>
                        <time className="list-time" dateTime={f.uploadedAt}>
                          {formatDateTime(f.uploadedAt)}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </>
  );
}
