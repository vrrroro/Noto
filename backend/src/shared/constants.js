// Limits and allowed values shared by every Lambda.
// These files are plain JavaScript with no AWS imports so the frontend's
// demo mode can run exactly the same rules in the browser.

export const LIMITS = {
  TITLE_MAX: 150,
  DESCRIPTION_MAX: 2000,
  SUBJECT_NAME_MAX: 60,
  FILE_NAME_MAX: 150,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  UPLOAD_URL_TTL_SECONDS: 300, // presigned upload/download links live 5 minutes
  PENDING_UPLOAD_TTL_SECONDS: 60 * 60, // unconfirmed upload records expire after 1 hour
};

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

// The six colours a subject can be given (keys, not CSS: the frontend maps
// them to its palette). Orange is left out on purpose: it is Noto's dot.
export const SUBJECT_COLORS = ['violet', 'magenta', 'cyan', 'yellow', 'blue', 'green'];
export const DEFAULT_PRIORITY = 'MEDIUM';

// Extension -> content type. The backend decides the content type from the
// extension instead of trusting what the browser sends.
export const ALLOWED_FILE_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

export const FILE_STATUS = {
  PENDING: 'PENDING',
  UPLOADED: 'UPLOADED',
};
