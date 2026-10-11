import { ALLOWED_FILE_TYPES, LIMITS, SUBJECT_COLORS } from '@backend/shared/constants.js';
import { readJson, writeJson } from './storage.js';

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

// The name to greet the user by: the first word of the name on their account
// (Cognito's `name`), never a guess from the email. Empty when there is none.
export function greetingName(name = '') {
  const word = String(name).trim().split(/\s+/)[0] || '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// The six subject colours (keys from the backend) as CSS colours, with the
// names the colour picker reads out.
export const SUBJECT_PALETTE = {
  violet: { css: 'var(--violet)', label: 'Violet' },
  magenta: { css: 'var(--magenta)', label: 'Magenta' },
  cyan: { css: 'var(--cyan)', label: 'Cyan' },
  yellow: { css: 'var(--yellow)', label: 'Yellow' },
  blue: { css: 'var(--blue)', label: 'Blue' },
  green: { css: 'var(--green)', label: 'Green' },
};
export { SUBJECT_COLORS };

// Colours picked in this browser, by subject ID. Used when the API does not
// return a subject's colour (an older backend), so the pick still shows here.
const LOCAL_COLORS_KEY = 'scm.subjectColors';
export function rememberSubjectColor(subjectId, color) {
  writeJson(LOCAL_COLORS_KEY, { ...readJson(LOCAL_COLORS_KEY, {}), [subjectId]: color });
}

// Each subject keeps one accent colour everywhere it appears: the one picked
// for it, or else one from a rotation in the order subjects were created (only
// subjects without a pick count), so the first four never collide and a new
// subject does not recolour the others. Orange is left out on purpose: it is
// reserved for Noto's dot.
const ROTATION = ['magenta', 'cyan', 'yellow', 'violet'];

// Subject name (lower case) -> colour key.
function subjectColorKeys(subjects = []) {
  const local = readJson(LOCAL_COLORS_KEY, {});
  const picked = (s) => (SUBJECT_PALETTE[s.color] ? s.color : SUBJECT_PALETTE[local[s.subjectId]] ? local[s.subjectId] : null);
  const byAge = [...subjects].sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  const keys = new Map();
  let i = 0;
  for (const s of byAge) keys.set(s.name.toLowerCase(), picked(s) ?? ROTATION[i++ % ROTATION.length]);
  return keys;
}

export function subjectColors(subjects = []) {
  const keys = subjectColorKeys(subjects);
  return (name = '') => SUBJECT_PALETTE[keys.get(name.toLowerCase())]?.css ?? 'var(--violet)';
}

// The colour a new subject gets unless one is picked by hand: the least used
// of the six, the first in SUBJECT_COLORS order on a tie, so each new subject
// moves on to a fresh colour.
export function nextSubjectColor(subjects = []) {
  const used = new Map(SUBJECT_COLORS.map((c) => [c, 0]));
  for (const key of subjectColorKeys(subjects).values()) used.set(key, (used.get(key) ?? 0) + 1);
  return SUBJECT_COLORS.reduce((best, c) => (used.get(c) < used.get(best) ? c : best), SUBJECT_COLORS[0]);
}
