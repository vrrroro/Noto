import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusViews.jsx';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../components/Toast.jsx';
import { assignmentsApi, filesApi, subjectsApi } from '../services/api.js';
import { LIMITS } from '@backend/shared/constants.js';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function Subjects() {
  const toast = useToast();
  const { status, data, error, reload, setData } = useResource(async () => {
    const [subjects, assignments, files] = await Promise.all([subjectsApi.list(), assignmentsApi.list(), filesApi.list()]);
    return { subjects, assignments, files };
  });
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const counts = useMemo(() => {
    const result = {};
    if (!data) return result;
    for (const s of data.subjects) result[s.name] = { assignments: 0, pending: 0, files: 0 };
    for (const a of data.assignments) {
      if (!result[a.subject]) continue;
      result[a.subject].assignments += 1;
      if (!a.completed) result[a.subject].pending += 1;
    }
    for (const f of data.files) if (result[f.subject]) result[f.subject].files += 1;
    return result;
  }, [data]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return setFormError('Enter a subject name.');
    setSaving(true);
    setFormError('');
    try {
      const created = await subjectsApi.create(name.trim());
      setData((d) => ({
        ...d,
        subjects: [...d.subjects, created].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
      }));
      setName('');
      toast.success(`Added “${created.name}”.`);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    await subjectsApi.remove(deleting.subjectId);
    setData((d) => ({ ...d, subjects: d.subjects.filter((s) => s.subjectId !== deleting.subjectId) }));
    toast.success(`Deleted “${deleting.name}”.`);
  }

  return (
    <>
      <PageHeader title="My subjects" description="Subjects organise your assignments and notes." />

      <form className="card inline-form" onSubmit={handleAdd} noValidate>
        <div className="field">
          <label htmlFor="subject-name">New subject</label>
          <input
            id="subject-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Software Engineering"
            maxLength={LIMITS.SUBJECT_NAME_MAX}
            disabled={status !== 'success'}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving || status !== 'success'}>
          <Icon name="plus" size={16} /> {saving ? 'Adding…' : 'Add subject'}
        </button>
        {formError && (
          <p className="alert alert-error inline-form-error" role="alert">
            {formError}
          </p>
        )}
      </form>

      {status === 'loading' && <LoadingState label="Loading subjects…" />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} label="Failed to load subjects." />}

      {status === 'success' &&
        (data.subjects.length === 0 ? (
          <EmptyState icon="subjects" title="No subjects yet">
            Add the subjects you study this semester, such as DBMS or Operating Systems.
          </EmptyState>
        ) : (
          <ul className="subject-grid">
            {data.subjects.map((s) => {
              const c = counts[s.name];
              return (
                <li key={s.subjectId} className="subject-card">
                  <span className="subject-initial" aria-hidden="true">
                    {s.name[0].toUpperCase()}
                  </span>
                  <div className="subject-info">
                    <h3>{s.name}</h3>
                    <p className="text-muted text-sm">
                      {plural(c.assignments, 'assignment')} ({c.pending} pending) · {plural(c.files, 'file')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost-danger"
                    onClick={() => setDeleting(s)}
                    aria-label={`Delete subject ${s.name}`}
                  >
                    <Icon name="trash" size={16} /> Delete
                  </button>
                </li>
              );
            })}
          </ul>
        ))}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete subject?"
        message={
          deleting
            ? `“${deleting.name}” will be removed. Subjects that still have assignments or files cannot be deleted.`
            : ''
        }
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
