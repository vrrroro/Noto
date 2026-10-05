// Client-side search, filter and sort for lists that are already loaded.

const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

const SORTERS = {
  due: (a, b) => a.dueDate.localeCompare(b.dueDate) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
  priority: (a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.dueDate.localeCompare(b.dueDate),
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
};

const matchesQuery = (query, ...fields) => {
  const q = query.trim().toLowerCase();
  return !q || fields.some((f) => f?.toLowerCase().includes(q));
};

export function filterAssignments(assignments, { query = '', subject = '', status = 'all', sort = 'due' } = {}) {
  return assignments
    .filter((a) => matchesQuery(query, a.title, a.description, a.subject))
    .filter((a) => !subject || a.subject === subject)
    .filter((a) => status === 'all' || (status === 'completed' ? a.completed : !a.completed))
    .sort(SORTERS[sort] ?? SORTERS.due);
}

export function filterFiles(files, { query = '', subject = '', type = '' } = {}, typeOf = () => '') {
  return files
    .filter((f) => matchesQuery(query, f.fileName, f.subject))
    .filter((f) => !subject || f.subject === subject)
    .filter((f) => !type || typeOf(f.fileName) === type);
}
