// Lambda entry point: student-cloud-manager-files-<stage>
import { createFilesHandler } from '../apps/files.js';
import { filesRepo, filesStorage, subjectsRepo } from '../aws/deps.js';

export const handler = createFilesHandler({
  files: filesRepo(),
  subjects: subjectsRepo(),
  storage: filesStorage(),
});
