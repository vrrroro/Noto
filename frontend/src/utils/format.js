import { ALLOWED_FILE_TYPES, LIMITS } from '@backend/shared/constants.js';

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export function fileExtension(fileName = '') {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

const TYPE_GROUPS = {
  pdf: 'PDF',
  doc: 'Word',
  docx: 'Word',
  ppt: 'Slides',
  pptx: 'Slides',
  txt: 'Text',
  png: 'Image',
  jpg: 'Image',
  jpeg: 'Image',
};

export const fileTypeLabel = (fileName) => TYPE_GROUPS[fileExtension(fileName)] || 'File';
export const FILE_TYPE_GROUPS = [...new Set(Object.values(TYPE_GROUPS))];

export const ACCEPT_ATTRIBUTE = Object.keys(ALLOWED_FILE_TYPES)
  .map((ext) => `.${ext}`)
  .join(',');

export const MAX_FILE_SIZE = LIMITS.MAX_FILE_SIZE_BYTES;

// Same checks the backend performs, done early for a faster error message.
export function checkFileBeforeUpload(file) {
  if (!ALLOWED_FILE_TYPES[fileExtension(file.name)]) {
    return `“${file.name}” is not a supported type. Allowed: ${ACCEPT_ATTRIBUTE.replaceAll(',', ', ')}`;
  }
  if (file.size === 0) return `“${file.name}” is empty.`;
  if (file.size > MAX_FILE_SIZE) return `“${file.name}” is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_FILE_SIZE)}.`;
  return null;
}

export function greetingName(email = '') {
  const local = email.split('@')[0] || 'Student';
  const word = local.split(/[._\-+0-9]/).find(Boolean) || 'Student';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Each subject keeps one accent colour everywhere it appears. Colours rotate
// in the order subjects were created, so the first four never collide and a
// new subject does not recolour the others. Orange is left out on purpose:
// it is reserved for Noto's dot.
const SUBJECT_COLORS = ['var(--magenta)', 'var(--cyan)', 'var(--yellow)', 'var(--violet)'];

export function subjectColors(subjects = []) {
  const byAge = [...subjects].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  const colors = new Map(byAge.map((s, i) => [s.name.toLowerCase(), SUBJECT_COLORS[i % SUBJECT_COLORS.length]]));
  return (name = '') => colors.get(name.toLowerCase()) ?? 'var(--violet)';
}
