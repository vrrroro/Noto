import { createHttpHandler } from '../shared/http.js';
import { ok, created } from '../shared/response.js';
import { notFound, conflict } from '../shared/errors.js';
import { validateSubjectColor, validateSubjectName } from '../shared/validation.js';
import { FILE_STATUS } from '../shared/constants.js';
import { toPublic, defaultClock, defaultIdGenerator } from './common.js';

export function createSubjectRoutes({ subjects, assignments, files, now = defaultClock, newId = defaultIdGenerator }) {
  return {
    'GET /subjects': async ({ userId }) => {
      const items = await subjects.list(userId);
      items.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      return ok(items.map(toPublic));
    },

    'POST /subjects': async ({ userId, body, log }) => {
      const name = validateSubjectName(body);
      const color = validateSubjectColor(body);
      const existing = await subjects.list(userId);
      if (existing.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
        throw conflict('SUBJECT_EXISTS', `You already have a subject called "${name}".`);
      }

      const item = { subjectId: newId(), userId, name, createdAt: now().toISOString() };
      if (color) item.color = color;
      await subjects.create(item);
      log.info('Subject created', { subjectId: item.subjectId });
      return created(toPublic(item));
    },

    // A subject that is still used by assignments or files cannot be deleted,
    // otherwise those records would point to a subject that no longer exists.
    'DELETE /subjects/{id}': async ({ userId, params, log }) => {
      const subject = await subjects.get(userId, params.id);
      if (!subject) throw notFound('SUBJECT_NOT_FOUND', 'Subject not found.');

      const sameName = (item) => item.subject.toLowerCase() === subject.name.toLowerCase();
      const [userAssignments, userFiles] = await Promise.all([assignments.list(userId), files.list(userId)]);
      const assignmentCount = userAssignments.filter(sameName).length;
      const fileCount = userFiles.filter((f) => f.status === FILE_STATUS.UPLOADED && sameName(f)).length;

      if (assignmentCount > 0 || fileCount > 0) {
        throw conflict(
          'SUBJECT_IN_USE',
          `"${subject.name}" is still used by ${assignmentCount} assignment(s) and ${fileCount} file(s). Move or delete them first.`,
        );
      }

      await subjects.remove(userId, params.id);
      log.info('Subject deleted', { subjectId: params.id });
      return ok({ subjectId: params.id }, 200, { message: 'Subject deleted.' });
    },
  };
}

export function createSubjectsHandler(deps) {
  return createHttpHandler({ name: 'subjects', routes: createSubjectRoutes(deps), logger: deps.logger });
}
