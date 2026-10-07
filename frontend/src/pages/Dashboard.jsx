import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusViews.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useResource } from '../hooks/useResource.js';
import { assignmentsApi, filesApi, subjectsApi } from '../services/api.js';
import { daysUntil, dueStatus, formatDateTime, formatShortDate } from '../utils/date.js';
import { fileExtension, formatBytes, greetingName, subjectColors } from '../utils/format.js';

const UPCOMING_LIMIT = 5;
const RECENT_FILES_LIMIT = 5;

// All dashboard numbers are calculated from the real API data.
export function summarize(assignments, files, now = new Date()) {
  const pending = assignments.filter((a) => !a.completed);
  return {
    total: assignments.length,
    pending: pending.length,
    completed: assignments.length - pending.length,
    overdue: pending.filter((a) => daysUntil(a.dueDate, now) < 0).length,
    upcoming: pending
      .filter((a) => daysUntil(a.dueDate, now) >= 0)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, UPCOMING_LIMIT),
    recentFiles: [...files].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)).slice(0, RECENT_FILES_LIMIT),
  };
}

function StatTile({ label, value, tone, icon }) {
  return (
    <div className={`stat-tile tone-${tone}`}>
      <span className="stat-icon">
        <Icon name={icon} />
      </span>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// The orange dot springs from 0 to the real completion figure once the data arrives.
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
        style={{ '--p': shown }}
      >
        <span className="meter-fill" />
        <span className="meter-dot" />
      </div>
      <p className="meter-label">
        <strong>{percent}%</strong> of assignments completed
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { status, data, error, reload } = useResource(async () => {
    const [assignments, files, subjects] = await Promise.all([assignmentsApi.list(), filesApi.list(), subjectsApi.list()]);
    return { ...summarize(assignments, files), colorOf: subjectColors(subjects) };
  });

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <>
      <PageHeader
        title={
          <>
            Hello, <em>{greetingName(user?.email)}</em>
          </>
        }
        description={today}
        actions={
          <>
            <Link to="/notes" className="btn btn-secondary">
              <Icon name="upload" size={16} /> Upload notes
            </Link>
            <Link to="/assignments?new=1" className="btn btn-primary">
              <Icon name="plus" size={16} /> New assignment
            </Link>
          </>
        }
      />

      {status === 'loading' && <LoadingState label="Loading your dashboard…" />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} label="Failed to load the dashboard." />}

      {status === 'success' && (
        <>
          <section aria-labelledby="stats-heading" className="section">
            <h2 id="stats-heading" className="visually-hidden">
              Assignment summary
            </h2>
            <div className="stats-grid">
              <StatTile label="Total" value={data.total} tone="neutral" icon="assignments" />
              <StatTile label="Pending" value={data.pending} tone="warning" icon="clock" />
              <StatTile label="Completed" value={data.completed} tone="success" icon="check" />
              <StatTile label="Overdue" value={data.overdue} tone={data.overdue ? 'danger' : 'success'} icon="alert" />
            </div>
            {data.total > 0 && <CompletionMeter completed={data.completed} total={data.total} />}
          </section>

          <div className="dashboard-grid">
            <section className="card" aria-labelledby="upcoming-heading">
              <div className="card-header">
                <h2 id="upcoming-heading" className="card-title">
                  Upcoming
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
                  Recent files
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
                          {f.subject} · {formatBytes(f.fileSize)}
                        </span>
                      </span>
                      <time className="text-muted text-sm" dateTime={f.uploadedAt}>
                        {formatDateTime(f.uploadedAt)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
