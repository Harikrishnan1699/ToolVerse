import { Injectable } from '@angular/core';

interface SharedPayload {
  files: { name: string; type: string; size: number; buffer: ArrayBuffer }[];
  text: string;
  title: string;
  url: string;
  ts: number;
}

const DB_NAME = 'tv-shared';
const STORE = 'files';

@Injectable({ providedIn: 'root' })
export class SharedFilesService {
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async take(): Promise<{ files: File[]; text: string; title: string; url: string } | null> {
    try {
      const db = await this.open();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        const get = store.get('payload');
        get.onsuccess = () => {
          const payload = get.result as SharedPayload | undefined;
          store.delete('payload');
          if (!payload) { resolve(null); return; }
          const files = (payload.files ?? []).map(f =>
            new File([f.buffer], f.name, { type: f.type }));
          resolve({ files, text: payload.text ?? '', title: payload.title ?? '', url: payload.url ?? '' });
        };
        get.onerror = () => reject(get.error);
        tx.oncomplete = () => db.close();
      });
    } catch { return null; }
  }
}
