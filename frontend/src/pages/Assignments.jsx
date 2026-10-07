import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import AssignmentCard from '../components/AssignmentCard.jsx';
import AssignmentForm from '../components/AssignmentForm.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusViews.jsx';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../components/Toast.jsx';
import { assignmentsApi, subjectsApi } from '../services/api.js';
import { filterAssignments } from '../utils/filters.js';
import { subjectColors } from '../utils/format.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

export default function Assignments() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { status, data, error, reload, setData } = useResource(async () => {
    const [assignments, subjects] = await Promise.all([assignmentsApi.list(), subjectsApi.list()]);
    return { assignments, subjects };
  });

  const [filters, setFilters] = useState({ query: '', subject: '', status: 'all', sort: 'due' });
  const [editing, setEditing] = useState(null); // null | 'new' | assignment
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Dashboard links to /assignments?new=1 to open the create form directly.
  useEffect(() => {
    if (searchParams.get('new') === '1' && status === 'success' && data.subjects.length > 0) {
      setEditing('new');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, status, data]);

  const visible = useMemo(() => (data ? filterAssignments(data.assignments, filters) : []), [data, filters]);
  const colorOf = useMemo(() => subjectColors(data?.subjects), [data]);
  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  const replace = (updated) =>
    setData((d) => ({ ...d, assignments: d.assignments.map((a) => (a.assignmentId === updated.assignmentId ? updated : a)) }));

  async function handleSave(values) {
    if (editing === 'new') {
      const created = await assignmentsApi.create(values);
      setData((d) => ({ ...d, assignments: [...d.assignments, created] }));
      toast.success(`Created “${created.title}”.`);
    } else {
      replace(await assignmentsApi.update(editing.assignmentId, values));
      toast.success('Assignment updated.');
    }
    setEditing(null);
  }

  async function handleToggle(assignment) {
    setBusyId(assignment.assignmentId);
    try {
      const updated = await assignmentsApi.update(assignment.assignmentId, { completed: !assignment.completed });
      replace(updated);
      toast.success(updated.completed ? `Marked “${updated.title}” complete.` : `Moved “${updated.title}” back to pending.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    await assignmentsApi.remove(deleting.assignmentId);
    setData((d) => ({ ...d, assignments: d.assignments.filter((a) => a.assignmentId !== deleting.assignmentId) }));
    toast.success('Assignment deleted.');
  }

  const hasSubjects = data?.subjects.length > 0;
  const pendingCount = data ? data.assignments.filter((a) => !a.completed).length : 0;
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  return (
    <>
      <PageHeader
        title={
          <>
            My <em>assignments</em>
          </>
        }
        description="Track deadlines and mark work complete."
        summary={data && [plural(data.assignments.length, 'assignment'), `${pendingCount} pending`]}
        actions={
          hasSubjects && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
              Create assignment
            </button>
          )
        }
      />

      {status === 'loading' && <LoadingState label="Loading assignments…" />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} label="Failed to load assignments." />}

      {status === 'success' && !hasSubjects && (
        <EmptyState
          icon="subjects"
          title="Create a subject first"
          action={
            <Link to="/subjects" className="btn btn-primary">
              Go to subjects
            </Link>
          }
        >
          Every assignment belongs to a subject, such as DBMS or Operating Systems.
        </EmptyState>
      )}

      {status === 'success' && hasSubjects && (
        <>
          <div className="toolbar" role="search">
            <div className="search-field">
              <Icon name="search" size={16} />
              <label htmlFor="assignment-search" className="visually-hidden">
                Search assignments
              </label>
              <input
                id="assignment-search"
                type="search"
                placeholder="Search assignments"
                value={filters.query}
                onChange={setFilter('query')}
              />
            </div>
            <label className="visually-hidden" htmlFor="assignment-subject-filter">
              Filter by subject
            </label>
            <select id="assignment-subject-filter" value={filters.subject} onChange={setFilter('subject')}>
              <option value="">All subjects</option>
              {data.subjects.map((s) => (
                <option key={s.subjectId} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <label className="visually-hidden" htmlFor="assignment-sort">
              Sort by
            </label>
            <select id="assignment-sort" value={filters.sort} onChange={setFilter('sort')}>
              <option value="due">Sort: due date</option>
              <option value="priority">Sort: priority</option>
              <option value="recent">Sort: recently added</option>
            </select>
            <div className="segmented" role="group" aria-label="Filter by status">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={filters.status === o.value ? 'is-active' : ''}
                  aria-pressed={filters.status === o.value}
                  onClick={() => setFilters((f) => ({ ...f, status: o.value }))}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {data.assignments.length === 0 ? (
            <EmptyState
              icon="assignments"
              title="No assignments yet"
              action={
                <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
                  Create your first assignment
                </button>
              }
            >
              Add an assignment with a due date to start tracking it.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState icon="search" title="No matching assignments">
              Try a different search or filter.
            </EmptyState>
          ) : (
            <>
              <p className="result-count text-muted">
                Showing {visible.length} of {data.assignments.length}
              </p>
              <div className="card-list" data-reveal-cards>
                {visible.map((a) => (
                  <AssignmentCard
                    key={a.assignmentId}
                    assignment={a}
                    color={colorOf(a.subject)}
                    busy={busyId === a.assignmentId}
                    onToggleComplete={() => handleToggle(a)}
                    onEdit={() => setEditing(a)}
                    onDelete={() => setDeleting(a)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <Modal
        open={Boolean(editing)}
        title={editing === 'new' ? 'Create assignment' : 'Edit assignment'}
        label={editing === 'new' ? 'New' : 'Editing'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <AssignmentForm
            key={editing === 'new' ? 'new' : editing.assignmentId}
            assignment={editing === 'new' ? null : editing}
            subjects={data?.subjects ?? []}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete assignment?"
        message={deleting ? `“${deleting.title}” will be permanently deleted.` : ''}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
