import Icon from './Icon.jsx';
import { fileExtension, fileTypeLabel, formatBytes } from '../utils/format.js';
import { formatDateTime } from '../utils/date.js';

export default function FileCard({ file, color, onDownload, onDelete, busy }) {
  const ext = fileExtension(file.fileName);

  return (
    <article className="file-card" aria-busy={busy || undefined}>
      <span className={`file-type file-type-${ext}`} aria-hidden="true">
        {ext.toUpperCase().slice(0, 4)}
      </span>
      <div className="file-info">
        <h3 className="file-name" title={file.fileName}>
          {file.fileName}
        </h3>
        <p className="file-meta">
          <span className="chip" style={{ '--subject': color }}>
            {file.subject}
          </span>
          <span>{fileTypeLabel(file.fileName)}</span>
          <span>{formatBytes(file.fileSize)}</span>
          <span>
            Uploaded <time dateTime={file.uploadedAt}>{formatDateTime(file.uploadedAt)}</time>
          </span>
        </p>
      </div>
      <div className="card-actions">
        <button type="button" className="btn btn-sm btn-secondary" onClick={onDownload} disabled={busy}>
          <Icon name="download" size={16} /> Download
        </button>
        <button type="button" className="btn btn-sm btn-ghost-danger" onClick={onDelete} disabled={busy}>
          <Icon name="trash" size={16} /> Delete
        </button>
      </div>
    </article>
  );
}
