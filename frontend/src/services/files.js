// File upload/download flows.
//   Upload: ask the API for a presigned S3 POST -> send the file straight to S3
//           (with progress) -> ask the API to confirm the upload.
//   Download: ask the API for a short-lived presigned link -> open it.
import { isDemoMode } from '../config.js';
import { filesApi, ApiError } from './api.js';
import { getDemoBackend } from './demo/demoBackend.js';

function postToS3({ url, fields }, file, onProgress) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, value));
    form.append('file', file); // must be the last field for S3

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new ApiError(xhr.status, 'UPLOAD_FAILED', 'The file could not be uploaded to storage. Please try again.'));
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK_ERROR', 'Upload failed. Check your internet connection.'));
    xhr.send(form);
  });
}

async function demoPut({ fields }, file, onProgress) {
  for (const step of [0.25, 0.5, 0.75]) {
    onProgress?.(step);
    await new Promise((r) => setTimeout(r, 120));
  }
  await getDemoBackend().blobs.put(fields.key, file);
  onProgress?.(1);
}

export async function uploadFile(file, subject, onProgress) {
  const { file: record, upload } = await filesApi.requestUpload({
    fileName: file.name,
    fileSize: file.size,
    subject,
  });

  if (isDemoMode) await demoPut(upload, file, onProgress);
  else await postToS3(upload, file, onProgress);

  // Only after this call is the file considered successfully uploaded.
  return filesApi.complete(record.fileId);
}

function clickDownload(href, fileName) {
  const a = document.createElement('a');
  a.href = href;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadFile(file) {
  const { url, fileName } = await filesApi.downloadLink(file.fileId);

  if (isDemoMode) {
    const key = decodeURIComponent(url.replace('demo://download/', ''));
    const blob = await getDemoBackend().blobs.get(key);
    if (!blob) throw new ApiError(404, 'FILE_NOT_FOUND', 'File not found.');
    const objectUrl = URL.createObjectURL(blob);
    clickDownload(objectUrl, fileName);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    return;
  }

  // The presigned URL sets Content-Disposition: attachment, so S3 sends a download.
  clickDownload(url, fileName);
}
