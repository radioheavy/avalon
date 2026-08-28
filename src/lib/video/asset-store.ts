'use client';

const DATABASE_NAME = 'avalon-film-assets';
const DATABASE_VERSION = 1;
const BLOB_STORE = 'blobs';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(BLOB_STORE)) database.createObjectStore(BLOB_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Film asset database could not be opened.'));
  });
}

async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = database.transaction(BLOB_STORE, mode);
      const request = operation(tx.objectStore(BLOB_STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Film asset operation failed.'));
      tx.onabort = () => reject(tx.error ?? new Error('Film asset transaction was aborted.'));
    });
  } finally {
    database.close();
  }
}

export async function saveFilmAssetBlob(assetId: string, blob: Blob): Promise<void> {
  await transaction('readwrite', (store) => store.put(blob, assetId));
}

export async function getFilmAssetBlob(assetId: string): Promise<Blob | undefined> {
  return transaction<Blob | undefined>('readonly', (store) => store.get(assetId));
}

export async function deleteFilmAssetBlob(assetId: string): Promise<void> {
  await transaction('readwrite', (store) => store.delete(assetId));
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Captured frame could not be encoded.'));
    reader.onerror = () => reject(reader.error ?? new Error('Captured frame could not be read.'));
    reader.readAsDataURL(blob);
  });
}
