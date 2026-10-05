import { describe, expect, it } from 'vitest';
import { addDays, daysUntil, dueStatus, formatDate, parseDate, todayString } from './date.js';
import { checkFileBeforeUpload, fileTypeLabel, formatBytes, greetingName } from './format.js';
import { filterAssignments, filterFiles } from './filters.js';
import { passwordMeetsRules, isValidEmail } from './password.js';
import { summarize } from '../pages/Dashboard.jsx';

const NOW = new Date(2026, 9, 6, 15, 30); // 6 Oct 2026, local time

describe('date utils', () => {
  it('parses YYYY-MM-DD as a local date', () => {
    const d = parseDate('2026-10-15');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 15]);
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts whole days from today', () => {
    expect(todayString(NOW)).toBe('2026-10-06');
    expect(daysUntil('2026-10-06', NOW)).toBe(0);
    expect(daysUntil('2026-10-15', NOW)).toBe(9);
    expect(daysUntil('2026-10-04', NOW)).toBe(-2);
  });

  it('describes due status', () => {
    expect(dueStatus('2026-10-06', false, NOW)).toEqual({ label: 'Due today', tone: 'warning' });
    expect(dueStatus('2026-10-07', false, NOW).label).toBe('Due tomorrow');
    expect(dueStatus('2026-10-10', false, NOW)).toEqual({ label: 'Due in 4 days', tone: 'info' });
    expect(dueStatus('2026-10-05', false, NOW)).toEqual({ label: 'Overdue by 1 day', tone: 'danger' });
    expect(dueStatus('2026-10-01', true, NOW)).toEqual({ label: 'Completed', tone: 'success' });
  });

  it('formats dates like "15 October 2026"', () => {
    expect(formatDate('2026-10-15')).toBe('15 October 2026');
  });
});

describe('format utils', () => {
  it('formats byte sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1258291)).toBe('1.2 MB');
    expect(formatBytes(10 * 1024 * 1024)).toBe('10 MB');
  });

  it('labels file types', () => {
    expect(fileTypeLabel('notes.PDF')).toBe('PDF');
    expect(fileTypeLabel('slides.pptx')).toBe('Slides');
    expect(fileTypeLabel('weird')).toBe('File');
  });

  it('checks files before upload using the backend limits', () => {
    expect(checkFileBeforeUpload({ name: 'a.pdf', size: 100 })).toBeNull();
    expect(checkFileBeforeUpload({ name: 'a.exe', size: 100 })).toMatch(/not a supported type/);
    expect(checkFileBeforeUpload({ name: 'a.pdf', size: 11 * 1024 * 1024 })).toMatch(/limit is 10 MB/);
    expect(checkFileBeforeUpload({ name: 'a.pdf', size: 0 })).toMatch(/empty/);
  });

  it('builds a friendly greeting name from an email', () => {
    expect(greetingName('rohit.sharma@college.edu')).toBe('Rohit');
    expect(greetingName('')).toBe('Student');
  });
});

describe('password rules', () => {
  it('match the Cognito policy', () => {
    expect(passwordMeetsRules('Passw0rd')).toBe(true);
    expect(passwordMeetsRules('password1')).toBe(false);
    expect(passwordMeetsRules('Pass1')).toBe(false);
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
  });
});

const assignments = [
  { assignmentId: '1', title: 'DBMS ER', subject: 'DBMS', dueDate: '2026-10-03', priority: 'LOW', completed: true, createdAt: '1' },
  { assignmentId: '2', title: 'OS Lab', subject: 'OS', dueDate: '2026-10-12', priority: 'MEDIUM', completed: false, createdAt: '2' },
  { assignmentId: '3', title: 'DBMS Normalization', subject: 'DBMS', dueDate: '2026-10-08', priority: 'HIGH', completed: false, createdAt: '3', description: 'BCNF' },
  { assignmentId: '4', title: 'Late reading', subject: 'OS', dueDate: '2026-10-01', priority: 'LOW', completed: false, createdAt: '4' },
];

describe('filters', () => {
  it('searches, filters and sorts assignments', () => {
    expect(filterAssignments(assignments).map((a) => a.assignmentId)).toEqual(['4', '1', '3', '2']);
    expect(filterAssignments(assignments, { query: 'bcnf' }).map((a) => a.assignmentId)).toEqual(['3']);
    expect(filterAssignments(assignments, { subject: 'DBMS', status: 'pending' }).map((a) => a.assignmentId)).toEqual(['3']);
    expect(filterAssignments(assignments, { status: 'completed' }).map((a) => a.assignmentId)).toEqual(['1']);
    expect(filterAssignments(assignments, { sort: 'priority' })[0].assignmentId).toBe('3');
    expect(filterAssignments(assignments, { sort: 'recent' })[0].assignmentId).toBe('4');
  });

  it('filters files by subject and type', () => {
    const files = [
      { fileName: 'a.pdf', subject: 'DBMS' },
      { fileName: 'b.png', subject: 'OS' },
    ];
    expect(filterFiles(files, { type: 'Image' }, fileTypeLabel)).toEqual([files[1]]);
    expect(filterFiles(files, { subject: 'DBMS' }, fileTypeLabel)).toEqual([files[0]]);
  });
});

describe('dashboard summary', () => {
  it('counts totals, overdue and upcoming work', () => {
    const files = [
      { fileId: 'f1', uploadedAt: '2026-10-01T00:00:00Z' },
      { fileId: 'f2', uploadedAt: '2026-10-05T00:00:00Z' },
    ];
    const s = summarize(assignments, files, NOW);
    expect([s.total, s.pending, s.completed, s.overdue]).toEqual([4, 3, 1, 1]);
    expect(s.upcoming.map((a) => a.assignmentId)).toEqual(['3', '2']);
    expect(s.recentFiles.map((f) => f.fileId)).toEqual(['f2', 'f1']);
  });
});
