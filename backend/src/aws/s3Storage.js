import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LIMITS } from '../shared/constants.js';

// "attachment; filename=..." with a UTF-8 fallback so any file name downloads correctly.
function contentDisposition(fileName) {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Wraps the S3 operations the files API needs. The bucket is private:
 * the browser only ever receives short-lived presigned URLs for one exact key.
 */
export function createS3Storage(s3, bucket) {
  return {
    // Presigned POST lets S3 itself enforce the size limit and content type.
    async createUpload({ key, contentType, maxSize }) {
      const { url, fields } = await createPresignedPost(s3, {
        Bucket: bucket,
        Key: key,
        Conditions: [
          ['content-length-range', 1, maxSize],
          ['eq', '$Content-Type', contentType],
        ],
        Fields: { 'Content-Type': contentType },
        Expires: LIMITS.UPLOAD_URL_TTL_SECONDS,
      });
      return { url, fields, expiresIn: LIMITS.UPLOAD_URL_TTL_SECONDS };
    },

    // Returns { size } if the object exists, otherwise null.
    async headObject(key) {
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return { size: head.ContentLength ?? 0 };
      } catch (err) {
        if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) return null;
        throw err;
      }
    },

    async createDownloadUrl({ key, fileName, contentType }) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: contentDisposition(fileName),
        ResponseContentType: contentType,
      });
      return getSignedUrl(s3, command, { expiresIn: LIMITS.UPLOAD_URL_TTL_SECONDS });
    },

    async deleteObject(key) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
