import { Injectable } from '@angular/core';

type Listener = (data: any) => void;

@Injectable({ providedIn: 'root' })
export class BroadcastService {
  private channel: BroadcastChannel | null = null;
  private listeners = new Map<string, Set<Listener>>();

  init(): void {
    if (typeof BroadcastChannel === 'undefined') return;
    this.channel = new BroadcastChannel('toolverse');
    this.channel.onmessage = (e) => {
      const { type, data } = e.data ?? {};
      this.listeners.get(type)?.forEach(fn => fn(data));
    };
  }

  send(type: string, data?: any): void { this.channel?.postMessage({ type, data }); }

  on(type: string, fn: Listener): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(fn);
    return () => this.listeners.get(type)?.delete(fn);
  }
}
