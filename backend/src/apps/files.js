import { createHttpHandler } from '../shared/http.js';
import { ok, created } from '../shared/response.js';
import { notFound, conflict, badRequest } from '../shared/errors.js';
import { validateFileUpload } from '../shared/validation.js';
import { FILE_STATUS, LIMITS } from '../shared/constants.js';
import { toPublic, resolveSubject, defaultClock, defaultIdGenerator } from './common.js';

const fileNotFound = () => notFound('FILE_NOT_FOUND', 'File not found.');

// S3 keys always start with the owner's ID, e.g.
// users/abc123/files/file789/DBMS_Notes.pdf
export const buildS3Key = (userId, fileId, fileName) => `users/${userId}/files/${fileId}/${fileName}`;

/**
 * File routes. Upload flow:
 *   1. POST /files                -> metadata saved as PENDING, presigned S3 POST returned
 *   2. browser uploads directly to S3 (the file never passes through Lambda)
 *   3. POST /files/{id}/complete  -> Lambda checks the object really exists, marks UPLOADED
 * PENDING records carry a DynamoDB TTL, so abandoned uploads clean themselves up.
 */
export function createFileRoutes({ files, subjects, storage, now = defaultClock, newId = defaultIdGenerator }) {
  async function getOwnedFile(userId, fileId) {
    const item = await files.get(userId, fileId);
    if (!item) throw fileNotFound();
    return item;
  }

  return {
    'GET /files': async ({ userId }) => {
      const items = (await files.list(userId)).filter((f) => f.status === FILE_STATUS.UPLOADED);
      items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
      return ok(items.map(toPublic));
    },

    'POST /files': async ({ userId, body, log }) => {
      const input = validateFileUpload(body);
      input.subject = await resolveSubject(subjects, userId, input.subject);

      const fileId = newId();
      const createdAt = now();
      const item = {
        fileId,
        userId,
        fileName: input.fileName,
        subject: input.subject,
        s3Key: buildS3Key(userId, fileId, input.fileName),
        contentType: input.contentType,
        fileSize: input.fileSize,
        status: FILE_STATUS.PENDING,
        createdAt: createdAt.toISOString(),
        expiresAt: Math.floor(createdAt.getTime() / 1000) + LIMITS.PENDING_UPLOAD_TTL_SECONDS,
      };
      await files.create(item);

      const upload = await storage.createUpload({
        key: item.s3Key,
        contentType: item.contentType,
        maxSize: LIMITS.MAX_FILE_SIZE_BYTES,
      });
      log.info('Upload authorized', { fileId, contentType: item.contentType, fileSize: item.fileSize });
      return created({ file: toPublic(item), upload });
    },

    'POST /files/{id}/complete': async ({ userId, params, log }) => {
      const item = await getOwnedFile(userId, params.id);
      if (item.status === FILE_STATUS.UPLOADED) return ok(toPublic(item));

      const object = await storage.headObject(item.s3Key);
      if (!object) throw conflict('UPLOAD_INCOMPLETE', 'The file has not been uploaded yet.');

      // Defence in depth: S3 already enforces the size limit on the presigned POST.
      if (object.size > LIMITS.MAX_FILE_SIZE_BYTES) {
        await storage.deleteObject(item.s3Key);
        await files.remove(userId, item.fileId);
        throw badRequest('FILE_TOO_LARGE', 'File is too large.');
      }

      const updated = await files.update(
        userId,
        item.fileId,
        { status: FILE_STATUS.UPLOADED, fileSize: object.size, uploadedAt: now().toISOString() },
        { remove: ['expiresAt'] },
      );
      if (!updated) throw fileNotFound();
      log.info('Upload confirmed', { fileId: item.fileId, fileSize: object.size });
      return ok(toPublic(updated));
    },

    'GET /files/{id}/download': async ({ userId, params, log }) => {
      const item = await getOwnedFile(userId, params.id);
      if (item.status !== FILE_STATUS.UPLOADED) throw fileNotFound();

      const url = await storage.createDownloadUrl({
        key: item.s3Key,
        fileName: item.fileName,
        contentType: item.contentType,
      });
      log.info('Download link created', { fileId: item.fileId });
      return ok({ url, fileName: item.fileName, expiresIn: LIMITS.UPLOAD_URL_TTL_SECONDS });
    },

    'DELETE /files/{id}': async ({ userId, params, log }) => {
      const item = await getOwnedFile(userId, params.id);
      await storage.deleteObject(item.s3Key);
      await files.remove(userId, item.fileId);
      log.info('File deleted', { fileId: item.fileId });
      return ok({ fileId: item.fileId }, 200, { message: 'File deleted.' });
    },
  };
}

export function createFilesHandler(deps) {
  return createHttpHandler({ name: 'files', routes: createFileRoutes(deps), logger: deps.logger });
}
