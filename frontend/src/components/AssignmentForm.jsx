import { useState } from 'react';
import { LIMITS, PRIORITIES } from '@backend/shared/constants.js';
import { addDays, todayString } from '../utils/date.js';

const PRIORITY_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

function initialValues(assignment, subjects) {
  return {
    title: assignment?.title ?? '',
    subject: assignment?.subject ?? subjects[0]?.name ?? '',
    dueDate: assignment?.dueDate ?? addDays(todayString(), 7),
    priority: assignment?.priority ?? 'MEDIUM',
    description: assignment?.description ?? '',
  };
}

// Used for both "create" and "edit". The backend validates again; these
// checks only give faster feedback.
export default function AssignmentForm({ assignment, subjects, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initialValues(assignment, subjects));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setError('');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!values.title.trim()) return setError('Title is required.');
    if (!values.subject) return setError('Choose a subject.');
    if (!values.dueDate) return setError('Due date is required.');

    setSaving(true);
    setError('');
    try {
      await onSubmit({ ...values, title: values.title.trim(), description: values.description.trim() });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}

      <div className="field">
        <label htmlFor="assignment-title">Title</label>
        <input
          id="assignment-title"
          value={values.title}
          onChange={update('title')}
          maxLength={LIMITS.TITLE_MAX}
          placeholder="e.g. DBMS Assignment 3"
          required
          autoFocus
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="assignment-subject">Subject</label>
          <select id="assignment-subject" value={values.subject} onChange={update('subject')} required>
            {subjects.map((s) => (
              <option key={s.subjectId} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="assignment-due">Due date</label>
          <input id="assignment-due" type="date" value={values.dueDate} onChange={update('dueDate')} required />
        </div>
        <div className="field">
          <label htmlFor="assignment-priority">Priority</label>
          <select id="assignment-priority" value={values.priority} onChange={update('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="assignment-description">
          Description <span className="optional">(optional)</span>
        </label>
        <textarea
          id="assignment-description"
          rows={4}
          value={values.description}
          onChange={update('description')}
          maxLength={LIMITS.DESCRIPTION_MAX}
          placeholder="What needs to be done?"
        />
        <span className="field-hint">
          {values.description.length}/{LIMITS.DESCRIPTION_MAX}
        </span>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : assignment ? 'Save changes' : 'Create assignment'}
        </button>
      </div>
    </form>
  );
}
