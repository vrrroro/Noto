import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Icon from '../components/Icon.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FileCard from '../components/FileCard.jsx';
import FileUpload from '../components/FileUpload.jsx';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusViews.jsx';
import { useResource } from '../hooks/useResource.js';
import { useToast } from '../components/Toast.jsx';
import { filesApi, subjectsApi } from '../services/api.js';
import { downloadFile } from '../services/files.js';
import { filterFiles } from '../utils/filters.js';
import { FILE_TYPE_GROUPS, fileTypeLabel, subjectColors } from '../utils/format.js';

export default function Notes() {
  const toast = useToast();
  const { status, data, error, reload, setData } = useResource(async () => {
    const [files, subjects] = await Promise.all([filesApi.list(), subjectsApi.list()]);
    return { files, subjects };
  });
  const [filters, setFilters] = useState({ query: '', subject: '', type: '' });
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const visible = useMemo(() => (data ? filterFiles(data.files, filters, fileTypeLabel) : []), [data, filters]);
  const colorOf = useMemo(() => subjectColors(data?.subjects), [data]);
  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  function handleUploaded(file) {
    setData((d) => ({ ...d, files: [file, ...d.files] }));
    toast.success(`Uploaded “${file.fileName}”.`);
  }

  async function handleDownload(file) {
    setBusyId(file.fileId);
    try {
      await downloadFile(file);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    await filesApi.remove(deleting.fileId);
    setData((d) => ({ ...d, files: d.files.filter((f) => f.fileId !== deleting.fileId) }));
    toast.success('File deleted.');
  }

  const hasSubjects = data?.subjects.length > 0;

  return (
    <>
      <PageHeader
        title={
          <>
            My <em>notes</em>
          </>
        }
        description="Upload, organise and download your study files."
      />

      {status === 'loading' && <LoadingState label="Loading files…" />}
      {status === 'error' && <ErrorState error={error} onRetry={reload} label="Failed to load files." />}

      {status === 'success' && !hasSubjects && (
        <EmptyState
          icon="subjects"
          title="Create a subject first"
          action={
            <Link to="/subjects" className="btn btn-primary">
              Go to subjects
            </Link>
          }
        >
          Files are organised by subject.
        </EmptyState>
      )}

      {status === 'success' && hasSubjects && (
        <>
          <FileUpload subjects={data.subjects} onUploaded={handleUploaded} />

          <div className="toolbar" role="search">
            <div className="search-field">
              <Icon name="search" size={16} />
              <label htmlFor="file-search" className="visually-hidden">
                Search files
              </label>
              <input
                id="file-search"
                type="search"
                placeholder="Search files"
                value={filters.query}
                onChange={setFilter('query')}
              />
            </div>
            <label className="visually-hidden" htmlFor="file-subject-filter">
              Filter by subject
            </label>
            <select id="file-subject-filter" value={filters.subject} onChange={setFilter('subject')}>
              <option value="">All subjects</option>
              {data.subjects.map((s) => (
                <option key={s.subjectId} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <label className="visually-hidden" htmlFor="file-type-filter">
              Filter by type
            </label>
            <select id="file-type-filter" value={filters.type} onChange={setFilter('type')}>
              <option value="">All types</option>
              {FILE_TYPE_GROUPS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {data.files.length === 0 ? (
            <EmptyState icon="notes" title="No files yet">
              Upload your first set of notes using the form above.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState icon="search" title="No matching files">
              Try a different search or filter.
            </EmptyState>
          ) : (
            <>
              <p className="result-count text-muted">
                Showing {visible.length} of {data.files.length}
              </p>
              <div className="card-list file-grid">
                {visible.map((f) => (
                  <FileCard
                    key={f.fileId}
                    file={f}
                    color={colorOf(f.subject)}
                    busy={busyId === f.fileId}
                    onDownload={() => handleDownload(f)}
                    onDelete={() => setDeleting(f)}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete file?"
        message={deleting ? `“${deleting.fileName}” will be permanently deleted from storage.` : ''}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
