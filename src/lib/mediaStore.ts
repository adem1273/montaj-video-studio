export type MediaType = 'video' | 'image' | 'audio';

export type MediaAsset = {
  id: string;
  name: string;
  type: MediaType;
  size: number;
  mime: string;
  createdAt: number;
  blob: Blob;
};

const DB_NAME = 'media-manager';
const STORE = 'assets';
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllAssets(): Promise<MediaAsset[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const items = (req.result as MediaAsset[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
    db.close();
  });
}

export async function addAsset(asset: MediaAsset): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add(asset);
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateAsset(asset: MediaAsset): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(asset);
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => reject(tx.error);
  });
}

// ── Batch export queue persistence ────────────────────────────────────────

export type BatchQueueEntry = {
  id: string;
  title: string;
  status: 'pending' | 'rendering' | 'done' | 'error';
  progress?: string;
  error?: string;
  videoBlob?: Blob;
  projectJson: string;
  updatedAt: number;
};

const QUEUE_DB = 'batch-export';
const QUEUE_STORE = 'queue';
const QUEUE_VERSION = 1;

function openQueueDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, QUEUE_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBatchQueue(entries: BatchQueueEntry[]): Promise<void> {
  const db = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).clear();
    for (const entry of entries) {
      tx.objectStore(QUEUE_STORE).put(entry);
    }
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadBatchQueue(): Promise<BatchQueueEntry[]> {
  const db = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly');
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => {
      const items = (req.result as BatchQueueEntry[]).sort((a, b) => a.updatedAt - b.updatedAt);
      resolve(items);
      db.close();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearBatchQueue(): Promise<void> {
  const db = await openQueueDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite');
    tx.objectStore(QUEUE_STORE).clear();
    tx.oncomplete = () => { resolve(); db.close(); };
    tx.onerror = () => reject(tx.error);
  });
}

export function classifyFile(file: File): MediaType | null {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('audio/')) return 'audio';
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext && ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  if (ext && ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (ext && ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) return 'audio';
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
