import { getCareerPeakOverall } from "./game";
import type { Career } from "./game-types";

const DATABASE_NAME = "bench-to-hall-career-archive";
const STORE_NAME = "careers";
let pendingWrites = Promise.resolve();

function openArchive(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }

    const request = indexedDB.open(DATABASE_NAME, 1);
    let blocked = false;
    request.onupgradeneeded = () => {
      if (blocked) {
        request.transaction?.abort();
        return;
      }
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onblocked = () => {
      blocked = true;
      reject(new Error("The career archive is blocked by another connection."));
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      if (blocked) {
        database.close();
        return;
      }
      database.onversionchange = () => database.close();
      resolve(database);
    };
  });
}

async function archiveTransaction<T>(
  mode: "readonly" | "readwrite",
  operate: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const database = await openArchive();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      let request: IDBRequest<T> | void;
      transaction.oncomplete = () => resolve(request?.result);
      transaction.onabort = () => reject(transaction.error ?? new Error("The career archive transaction was aborted."));
      try {
        request = operate(transaction.objectStore(STORE_NAME));
      } catch (error) {
        reject(error);
        transaction.abort();
      }
    });
  } finally {
    database.close();
  }
}

function writeArchive(operate: (store: IDBObjectStore) => void): Promise<void> {
  const write = pendingWrites.then(async () => {
    await archiveTransaction("readwrite", operate);
  });
  pendingWrites = write.catch(() => {});
  return write;
}

export async function readArchivedCareer(id: string): Promise<Career | undefined> {
  await pendingWrites;
  return archiveTransaction<Career>("readonly", store => store.get(id));
}

export async function readArchivedCareerPeakOveralls(ids: readonly string[]): Promise<Map<string, number>> {
  const peaks = new Map<string, number>();
  if (ids.length === 0) return peaks;

  await pendingWrites;
  await archiveTransaction("readonly", store => {
    for (const id of new Set(ids)) {
      const request = store.get(id);
      request.onsuccess = () => {
        const career: Career | undefined = request.result;
        if (career) peaks.set(id, getCareerPeakOverall(career));
      };
    }
  });
  return peaks;
}

export function saveArchivedCareer(career: Career): Promise<void> {
  return writeArchive(store => {
    store.put(career);
  });
}
