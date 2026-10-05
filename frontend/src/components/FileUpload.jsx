import { useId, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { ACCEPT_ATTRIBUTE, MAX_FILE_SIZE, checkFileBeforeUpload, formatBytes } from '../utils/format.js';
import { uploadFile } from '../services/files.js';

export default function FileUpload({ subjects, onUploaded }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState(subjects[0]?.name ?? '');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);
  const uploading = progress !== null;

  function choose(selected) {
    if (!selected) return;
    const problem = checkFileBeforeUpload(selected);
    setError(problem || '');
    setFile(problem ? null : selected);
  }

  function reset() {
    setFile(null);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError('Choose a file to upload.');
    if (!subject) return setError('Choose a subject.');

    setError('');
    setProgress(0);
    try {
      const uploaded = await uploadFile(file, subject, setProgress);
      onUploaded(uploaded);
      reset();
    } catch (err) {
      setError(err.message);
      setProgress(null);
    }
  }

  return (
    <form className="card upload-card" onSubmit={handleSubmit} noValidate>
      <h2 className="card-title">Upload a file</h2>

      <label
        htmlFor={inputId}
        className={`dropzone ${dragging ? 'is-dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) choose(e.dataTransfer.files?.[0]);
        }}
      >
        <Icon name={file ? 'file' : 'upload'} size={26} />
        {file ? (
          <span>
            <strong>{file.name}</strong>
            <span className="text-muted"> · {formatBytes(file.size)}</span>
          </span>
        ) : (
          <span>
            <strong>Choose a file</strong> or drag it here
          </span>
        )}
        <span className="field-hint">
          PDF, Word, PowerPoint, text or images · max {formatBytes(MAX_FILE_SIZE)}
        </span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          className="visually-hidden"
          accept={ACCEPT_ATTRIBUTE}
          disabled={uploading}
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </label>

      <div className="upload-controls">
        <div className="field">
          <label htmlFor={`${inputId}-subject`}>Subject</label>
          <select
            id={`${inputId}-subject`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={uploading}
          >
            {subjects.map((s) => (
              <option key={s.subjectId} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
          <Icon name="upload" size={16} />
          {uploading ? `Uploading ${Math.round(progress * 100)}%` : 'Upload'}
        </button>
      </div>

      {uploading && (
        <progress className="progress" value={progress} max={1} aria-label="Upload progress">
          {Math.round(progress * 100)}%
        </progress>
      )}
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
