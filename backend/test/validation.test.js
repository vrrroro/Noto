import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidDateString,
  validateNewAssignment,
  validateAssignmentUpdate,
  sanitizeFileName,
  validateFileUpload,
  validateSubjectName,
} from '../src/shared/validation.js';

const validAssignment = { title: 'DBMS Assignment 3', subject: 'DBMS', dueDate: '2026-10-15' };

test('isValidDateString accepts real dates only', () => {
  assert.equal(isValidDateString('2026-10-15'), true);
  assert.equal(isValidDateString('2028-02-29'), true);
  assert.equal(isValidDateString('2026-02-30'), false);
  assert.equal(isValidDateString('banana'), false);
  assert.equal(isValidDateString('15-10-2026'), false);
  assert.equal(isValidDateString(20261015), false);
});

test('validateNewAssignment trims, defaults priority and drops unknown fields', () => {
  const result = validateNewAssignment({ ...validAssignment, title: '  DBMS  ', userId: 'attacker', priority: 'high' });
  assert.deepEqual(result, {
    title: 'DBMS',
    description: '',
    subject: 'DBMS',
    dueDate: '2026-10-15',
    priority: 'HIGH',
  });
  assert.equal(validateNewAssignment(validAssignment).priority, 'MEDIUM');
});

test('validateNewAssignment rejects bad input', () => {
  assert.throws(() => validateNewAssignment({ ...validAssignment, title: '' }), /Title is required/);
  assert.throws(() => validateNewAssignment({ ...validAssignment, title: 'x'.repeat(151) }), /at most 150/);
  assert.throws(() => validateNewAssignment({ ...validAssignment, dueDate: 'banana' }), /valid date/);
  assert.throws(() => validateNewAssignment({ ...validAssignment, subject: ' ' }), /Subject is required/);
  assert.throws(() => validateNewAssignment({ ...validAssignment, description: 'x'.repeat(2001) }), /at most 2000/);
  assert.throws(() => validateNewAssignment({ ...validAssignment, priority: 'URGENT' }), /Priority must be one of/);
  assert.throws(() => validateNewAssignment([]), /JSON object/);
  assert.throws(() => validateNewAssignment(null), /JSON object/);
});

test('validateAssignmentUpdate accepts partial updates', () => {
  assert.deepEqual(validateAssignmentUpdate({ completed: true }), { completed: true });
  assert.throws(() => validateAssignmentUpdate({}), /No valid fields/);
  assert.throws(() => validateAssignmentUpdate({ userId: 'x' }), /No valid fields/);
  assert.throws(() => validateAssignmentUpdate({ completed: 'yes' }), /true or false/);
  assert.throws(() => validateAssignmentUpdate({ title: '' }), /Title is required/);
});

test('validateSubjectName', () => {
  assert.equal(validateSubjectName({ name: '  Cloud Computing ' }), 'Cloud Computing');
  assert.throws(() => validateSubjectName({ name: '' }), /Subject name is required/);
  assert.throws(() => validateSubjectName({ name: 'x'.repeat(61) }), /at most 60/);
});

test('sanitizeFileName removes paths and unsafe characters', () => {
  assert.equal(sanitizeFileName('../../etc/passwd.txt'), 'passwd.txt');
  assert.equal(sanitizeFileName('C:\\Users\\me\\DBMS Notes.pdf'), 'DBMS Notes.pdf');
  assert.equal(sanitizeFileName('a<b>c?.pdf'), 'a_b_c_.pdf');
  assert.equal(sanitizeFileName('.hidden.pdf'), 'hidden.pdf');
  const long = sanitizeFileName('x'.repeat(300) + '.pdf');
  assert.equal(long.length, 150);
  assert.ok(long.endsWith('.pdf'));
});

test('validateFileUpload checks type and size and derives content type', () => {
  const ok = validateFileUpload({ fileName: 'Notes.PDF', fileSize: 1024, subject: 'DBMS' });
  assert.equal(ok.contentType, 'application/pdf');

  assert.throws(
    () => validateFileUpload({ fileName: 'virus.exe', fileSize: 10, subject: 'DBMS' }),
    (err) => err.code === 'UNSUPPORTED_FILE_TYPE',
  );
  assert.throws(
    () => validateFileUpload({ fileName: 'big.pdf', fileSize: 10 * 1024 * 1024 + 1, subject: 'DBMS' }),
    (err) => err.code === 'FILE_TOO_LARGE',
  );
  assert.throws(() => validateFileUpload({ fileName: 'a.pdf', fileSize: 0, subject: 'DBMS' }), /positive/);
  assert.throws(() => validateFileUpload({ fileName: 'a.pdf', fileSize: 1.5, subject: 'DBMS' }), /positive/);
  assert.throws(() => validateFileUpload({ fileName: '', fileSize: 10, subject: 'DBMS' }), /File name is required/);
});
