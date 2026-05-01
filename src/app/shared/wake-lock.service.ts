import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WakeLockService {
  private lock: any = null;
  readonly active = signal(false);

  get supported() { return typeof navigator !== 'undefined' && 'wakeLock' in navigator; }

  async request(): Promise<void> {
    if (!this.supported) return;
    try {
      this.lock = await (navigator as any).wakeLock.request('screen');
      this.active.set(true);
      this.lock.addEventListener('release', () => this.active.set(false));
      // Re-acquire on visibility change (browsers release on tab hide)
      document.addEventListener('visibilitychange', this.onVis);
    } catch { /* ignore — user may have low battery, etc. */ }
  }

  async release(): Promise<void> {
    document.removeEventListener('visibilitychange', this.onVis);
    try { await this.lock?.release(); } catch {}
    this.lock = null;
    this.active.set(false);
  }

  private onVis = async () => {
    if (document.visibilityState === 'visible' && this.lock === null && this.active()) {
      await this.request();
    }
  };
}
