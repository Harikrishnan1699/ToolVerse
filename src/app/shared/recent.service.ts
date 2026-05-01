import { Injectable, signal } from '@angular/core';

export interface RecentTool { route: string; title: string; icon: string; color: string; ts: number; }

const KEY = 'tv.recent';
const MAX = 10;

@Injectable({ providedIn: 'root' })
export class RecentService {
  readonly recent = signal<RecentTool[]>([]);

  init(): void {
    try { this.recent.set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch {}
  }

  push(tool: Omit<RecentTool, 'ts'>): void {
    const ts = Date.now();
    const list = [{ ...tool, ts }, ...this.recent().filter(t => t.route !== tool.route)].slice(0, MAX);
    this.recent.set(list);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  }

  clear(): void { this.recent.set([]); try { localStorage.removeItem(KEY); } catch {} }
}
