import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  get supported() { return typeof window !== 'undefined' && 'Notification' in window; }

  async ensurePermission(): Promise<boolean> {
    if (!this.supported) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    try {
      const p = await Notification.requestPermission();
      return p === 'granted';
    } catch { return false; }
  }

  async send(title: string, body?: string, opts: NotificationOptions = {}): Promise<void> {
    if (!(await this.ensurePermission())) return;
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const options: NotificationOptions = {
        body, icon: 'icons/icon-192x192.png', badge: 'icons/icon-96x96.png',
        ...opts,
      };
      if (reg) await reg.showNotification(title, options);
      else new Notification(title, options);
    } catch {}
    try { (navigator as any).vibrate?.([120, 60, 120]); } catch {}
  }
}
