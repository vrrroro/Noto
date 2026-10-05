// Due dates are stored as plain "YYYY-MM-DD" strings. They are parsed as
// local calendar dates (not UTC) so "due 15 Oct" never shifts to 14 Oct.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function parseDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const todayString = (now = new Date()) => toDateString(now);

export function addDays(dateString, days) {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

// Whole calendar days from today until the given date (negative = past).
export function daysUntil(dateString, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseDate(dateString) - today) / MS_PER_DAY);
}

export function formatDate(dateString, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return parseDate(dateString).toLocaleDateString('en-GB', options);
}

export const formatShortDate = (dateString) => formatDate(dateString, { day: 'numeric', month: 'short' });

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Returns a human label and a tone used for colouring.
export function dueStatus(dateString, completed, now = new Date()) {
  if (completed) return { label: 'Completed', tone: 'success' };
  const days = daysUntil(dateString, now);
  if (days < -1) return { label: `Overdue by ${-days} days`, tone: 'danger' };
  if (days === -1) return { label: 'Overdue by 1 day', tone: 'danger' };
  if (days === 0) return { label: 'Due today', tone: 'warning' };
  if (days === 1) return { label: 'Due tomorrow', tone: 'warning' };
  if (days <= 7) return { label: `Due in ${days} days`, tone: 'info' };
  return { label: `Due in ${days} days`, tone: 'neutral' };
}
