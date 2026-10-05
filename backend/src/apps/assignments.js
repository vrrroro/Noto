import { createHttpHandler } from '../shared/http.js';
import { ok, created } from '../shared/response.js';
import { notFound } from '../shared/errors.js';
import { validateNewAssignment, validateAssignmentUpdate } from '../shared/validation.js';
import { toPublic, resolveSubject, defaultClock, defaultIdGenerator } from './common.js';

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const assignmentNotFound = () => notFound('ASSIGNMENT_NOT_FOUND', 'Assignment not found.');

/**
 * Assignment routes. Every repository call is keyed by the authenticated
 * userId, so a user asking for someone else's assignment simply gets 404.
 */
export function createAssignmentRoutes({ assignments, subjects, now = defaultClock, newId = defaultIdGenerator }) {
  return {
    'GET /assignments': async ({ userId }) => {
      const items = await assignments.list(userId);
      items.sort(
        (a, b) =>
          a.dueDate.localeCompare(b.dueDate) ||
          (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1) ||
          a.createdAt.localeCompare(b.createdAt),
      );
      return ok(items.map(toPublic));
    },

    'GET /assignments/{id}': async ({ userId, params }) => {
      const item = await assignments.get(userId, params.id);
      if (!item) throw assignmentNotFound();
      return ok(toPublic(item));
    },

    'POST /assignments': async ({ userId, body, log }) => {
      const input = validateNewAssignment(body);
      log.info('Assignment creation started');
      input.subject = await resolveSubject(subjects, userId, input.subject);

      const timestamp = now().toISOString();
      const item = {
        assignmentId: newId(),
        userId,
        ...input,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await assignments.create(item);
      log.info('Assignment created successfully', { assignmentId: item.assignmentId });
      return created(toPublic(item));
    },

    'PUT /assignments/{id}': async ({ userId, params, body, log }) => {
      const changes = validateAssignmentUpdate(body);
      if (changes.subject) changes.subject = await resolveSubject(subjects, userId, changes.subject);
      changes.updatedAt = now().toISOString();

      const updated = await assignments.update(userId, params.id, changes);
      if (!updated) throw assignmentNotFound();
      log.info('Assignment updated', { assignmentId: params.id, fields: Object.keys(changes) });
      return ok(toPublic(updated));
    },

    'DELETE /assignments/{id}': async ({ userId, params, log }) => {
      const removed = await assignments.remove(userId, params.id);
      if (!removed) throw assignmentNotFound();
      log.info('Assignment deleted', { assignmentId: params.id });
      return ok({ assignmentId: params.id }, 200, { message: 'Assignment deleted.' });
    },
  };
}

export function createAssignmentsHandler(deps) {
  return createHttpHandler({ name: 'assignments', routes: createAssignmentRoutes(deps), logger: deps.logger });
}
