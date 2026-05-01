import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageManagerService {
  readonly persisted = signal(false);
  readonly quotaBytes = signal(0);
  readonly usageBytes = signal(0);

  async init(): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.storage) return;
    try {
      this.persisted.set(await navigator.storage.persisted());
      await this.refresh();
    } catch {}
  }

  async requestPersistent(): Promise<boolean> {
    try {
      const ok = await navigator.storage.persist();
      this.persisted.set(ok);
      return ok;
    } catch { return false; }
  }

  async refresh(): Promise<void> {
    try {
      const e = await navigator.storage.estimate();
      this.quotaBytes.set(e.quota ?? 0);
      this.usageBytes.set(e.usage ?? 0);
    } catch {}
  }

  fmt(b: number): string {
    if (!b) return '0 B';
    if (b < 1024) return b + ' B';
    if (b < 1024 ** 2) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1024 ** 3) return (b / 1024 / 1024).toFixed(1) + ' MB';
    return (b / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  }
}
