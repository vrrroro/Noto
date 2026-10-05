// Lambda entry point: student-cloud-manager-subjects-<stage>
import { createSubjectsHandler } from '../apps/subjects.js';
import { assignmentsRepo, filesRepo, subjectsRepo } from '../aws/deps.js';

export const handler = createSubjectsHandler({
  subjects: subjectsRepo(),
  assignments: assignmentsRepo(),
  files: filesRepo(),
});
