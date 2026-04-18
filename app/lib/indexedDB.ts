export const DB_NAME = "TripLogDB";
export const STORE_NAME = "images";

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveImageToDB(key: string, file: File | null) {
  if (typeof window === 'undefined') return;
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      if (file) {
        store.put(file, key);
      } else {
        store.delete(key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("IndexedDB error", e);
  }
}

export async function loadImagesFromDB(): Promise<Record<string, File>> {
  if (typeof window === 'undefined') return {};
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      const keysRequest = store.getAllKeys();
      
      tx.oncomplete = () => {
        const result: Record<string, File> = {};
        const keys = keysRequest.result;
        const values = request.result;
        keys.forEach((k, i) => {
          result[k as string] = values[i];
        });
        resolve(result);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("IndexedDB error", e);
    return {};
  }
}

export async function clearImagesFromDB() {
  if (typeof window === 'undefined') return;
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.error("IndexedDB error", e);
  }
}
