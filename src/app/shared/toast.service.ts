import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  kind: 'info' | 'success' | 'warn' | 'error';
  action?: { label: string; run: () => void };
  ttl?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, kind: Toast['kind'] = 'info', opts: { ttl?: number; action?: Toast['action'] } = {}) {
    const t: Toast = { id: this.nextId++, message, kind, ttl: opts.ttl ?? 4000, action: opts.action };
    this.toasts.update(a => [...a, t]);
    if (t.ttl && t.ttl > 0) setTimeout(() => this.dismiss(t.id), t.ttl);
    return t.id;
  }
  info(m: string, opts?: any) { return this.show(m, 'info', opts); }
  success(m: string, opts?: any) { return this.show(m, 'success', opts); }
  warn(m: string, opts?: any) { return this.show(m, 'warn', opts); }
  error(m: string, opts?: any) { return this.show(m, 'error', opts); }
  dismiss(id: number) { this.toasts.update(a => a.filter(t => t.id !== id)); }
}
