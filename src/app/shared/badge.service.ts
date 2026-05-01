import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  get supported() { return typeof navigator !== 'undefined' && 'setAppBadge' in navigator; }

  set(count?: number): void {
    if (!this.supported) return;
    try {
      if (typeof count === 'number' && count > 0) (navigator as any).setAppBadge(count);
      else (navigator as any).clearAppBadge();
    } catch {}
  }

  clear(): void { this.set(0); }
}
