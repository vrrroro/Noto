import { ALLOWED_FILE_TYPES, LIMITS, PRIORITIES, DEFAULT_PRIORITY } from './constants.js';
import { badRequest } from './errors.js';

const invalid = (message) => badRequest('VALIDATION_ERROR', message);

export function requireObject(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('Request body must be a JSON object.');
  }
  return body;
}

// Accepts only real calendar dates in YYYY-MM-DD form ("2026-02-30" is rejected).
export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function requiredText(value, field, max) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw invalid(`${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) throw invalid(`${field} must be at most ${max} characters.`);
  return trimmed;
}

function optionalText(value, field, max) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw invalid(`${field} must be text.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw invalid(`${field} must be at most ${max} characters.`);
  return trimmed;
}

function dueDate(value) {
  if (!isValidDateString(value)) throw invalid('Due date must be a valid date (YYYY-MM-DD).');
  return value;
}

function priority(value) {
  if (value === undefined || value === null || value === '') return DEFAULT_PRIORITY;
  const upper = typeof value === 'string' ? value.toUpperCase() : value;
  if (!PRIORITIES.includes(upper)) throw invalid(`Priority must be one of ${PRIORITIES.join(', ')}.`);
  return upper;
}

// Validates a new assignment. Only known fields are copied; anything else
// (including a userId sent by the client) is ignored.
export function validateNewAssignment(body) {
  requireObject(body);
  return {
    title: requiredText(body.title, 'Title', LIMITS.TITLE_MAX),
    description: optionalText(body.description, 'Description', LIMITS.DESCRIPTION_MAX),
    subject: requiredText(body.subject, 'Subject', LIMITS.SUBJECT_NAME_MAX),
    dueDate: dueDate(body.dueDate),
    priority: priority(body.priority),
  };
}

// Validates a partial update. At least one known field must be present.
export function validateAssignmentUpdate(body) {
  requireObject(body);
  const changes = {};
  if ('title' in body) changes.title = requiredText(body.title, 'Title', LIMITS.TITLE_MAX);
  if ('description' in body) changes.description = optionalText(body.description, 'Description', LIMITS.DESCRIPTION_MAX);
  if ('subject' in body) changes.subject = requiredText(body.subject, 'Subject', LIMITS.SUBJECT_NAME_MAX);
  if ('dueDate' in body) changes.dueDate = dueDate(body.dueDate);
  if ('priority' in body) changes.priority = priority(body.priority);
  if ('completed' in body) {
    if (typeof body.completed !== 'boolean') throw invalid('Completed must be true or false.');
    changes.completed = body.completed;
  }
  if (Object.keys(changes).length === 0) throw invalid('No valid fields to update.');
  return changes;
}

export function validateSubjectName(body) {
  requireObject(body);
  return requiredText(body.name, 'Subject name', LIMITS.SUBJECT_NAME_MAX);
}

// Strips any path, replaces unusual characters and enforces a length limit.
export function sanitizeFileName(rawName) {
  if (typeof rawName !== 'string') return '';
  const base = rawName.split(/[\\/]/).pop() ?? '';
  const cleaned = base
    .normalize('NFKC')
    .replace(/[^\w.\- ()]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/_{2,}/g, '_')
    .trim()
    .replace(/^\.+/, '');
  if (cleaned.length <= LIMITS.FILE_NAME_MAX) return cleaned;
  const dot = cleaned.lastIndexOf('.');
  const ext = dot > 0 ? cleaned.slice(dot) : '';
  return cleaned.slice(0, LIMITS.FILE_NAME_MAX - ext.length) + ext;
}

export function getExtension(fileName) {
  const dot = fileName.lastIndexOf('.');
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

export function validateFileUpload(body) {
  requireObject(body);
  const fileName = sanitizeFileName(body.fileName);
  if (!fileName) throw invalid('File name is required.');

  const extension = getExtension(fileName);
  const contentType = ALLOWED_FILE_TYPES[extension];
  if (!contentType) {
    throw badRequest(
      'UNSUPPORTED_FILE_TYPE',
      `Unsupported file type. Allowed: ${Object.keys(ALLOWED_FILE_TYPES).map((e) => '.' + e).join(', ')}.`,
    );
  }

  const { fileSize } = body;
  if (!Number.isInteger(fileSize) || fileSize <= 0) throw invalid('File size must be a positive number of bytes.');
  if (fileSize > LIMITS.MAX_FILE_SIZE_BYTES) {
    throw badRequest('FILE_TOO_LARGE', `File is too large. Maximum size is ${LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`);
  }

  return {
    fileName,
    contentType,
    fileSize,
    subject: requiredText(body.subject, 'Subject', LIMITS.SUBJECT_NAME_MAX),
  };
}
