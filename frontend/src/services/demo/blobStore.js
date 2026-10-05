// Demo-mode stand-in for the S3 bucket: stores file blobs in IndexedDB,
// keyed by the same S3 key the real backend would use.

const DB_NAME = 'scm-demo-files';
const STORE = 'objects';

let dbPromise;
function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function run(mode, action) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const indexedDbBlobStore = {
  put: (key, blob) => run('readwrite', (store) => store.put(blob, key)),
  get: (key) => run('readonly', (store) => store.get(key)),
  delete: (key) => run('readwrite', (store) => store.delete(key)),
};

// Used by unit tests (Node has no IndexedDB).
export function createMemoryBlobStore() {
  const map = new Map();
  return {
    put: async (key, blob) => void map.set(key, blob),
    get: async (key) => map.get(key),
    delete: async (key) => void map.delete(key),
  };
}
