// Lambda entry point: student-cloud-manager-assignments-<stage>
import { createAssignmentsHandler } from '../apps/assignments.js';
import { assignmentsRepo, subjectsRepo } from '../aws/deps.js';

export const handler = createAssignmentsHandler({
  assignments: assignmentsRepo(),
  subjects: subjectsRepo(),
});
