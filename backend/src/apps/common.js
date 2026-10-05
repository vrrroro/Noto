import { badRequest } from '../shared/errors.js';

// Removes the owner field before sending a record to the client.
export function toPublic(item) {
  if (!item) return item;
  const { userId, expiresAt, ...rest } = item;
  return rest;
}

// Finds the user's subject by name (case-insensitive) and returns its
// canonical spelling, so "dbms" and "DBMS" refer to the same subject.
export async function resolveSubject(subjectsRepo, userId, name) {
  const subjects = await subjectsRepo.list(userId);
  const match = subjects.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (!match) throw badRequest('SUBJECT_NOT_FOUND', `Subject "${name}" does not exist. Create it first.`);
  return match.name;
}

export const defaultClock = () => new Date();
export const defaultIdGenerator = () => globalThis.crypto.randomUUID();
