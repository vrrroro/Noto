// In-memory stand-in for a DynamoDB table with the same interface as
// createDynamoRepository. Used by the unit tests and by the frontend's
// demo mode (which persists the state to localStorage via onChange).

const clone = (value) => (value === undefined || value === null ? value : structuredClone(value));

export function createMemoryRepository(idKey, { initial = {}, onChange = () => {} } = {}) {
  // state: { [userId]: { [id]: item } }
  const state = clone(initial);
  const bucket = (userId) => (state[userId] ??= {});
  const changed = () => onChange(clone(state));

  return {
    async list(userId) {
      return Object.values(bucket(userId)).map(clone);
    },

    async get(userId, id) {
      return clone(bucket(userId)[id]) ?? null;
    },

    async create(item) {
      const items = bucket(item.userId);
      if (items[item[idKey]]) throw new Error(`Item ${item[idKey]} already exists`);
      items[item[idKey]] = clone(item);
      changed();
      return clone(item);
    },

    async update(userId, id, changes, { remove = [] } = {}) {
      const items = bucket(userId);
      if (!items[id]) return null;
      const next = { ...items[id], ...clone(changes) };
      for (const field of remove) delete next[field];
      items[id] = next;
      changed();
      return clone(next);
    },

    async remove(userId, id) {
      const items = bucket(userId);
      if (!items[id]) return false;
      delete items[id];
      changed();
      return true;
    },
  };
}
