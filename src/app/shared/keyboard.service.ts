import { Injectable, signal } from '@angular/core';

interface Shortcut { keys: string; description: string; run: () => void; scope?: string; }

@Injectable({ providedIn: 'root' })
export class KeyboardService {
  private shortcuts = signal<Shortcut[]>([]);
  readonly cheatsheetOpen = signal(false);

  init(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this.onKey);
  }

  list() { return this.shortcuts(); }

  register(s: Shortcut): () => void {
    this.shortcuts.update(a => [...a, s]);
    return () => this.shortcuts.update(a => a.filter(x => x !== s));
  }

  private onKey = (e: KeyboardEvent) => {
    // Ignore when typing in inputs
    const t = e.target as HTMLElement;
    const inForm = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t?.isContentEditable;

    // ? opens cheatsheet
    if (!inForm && e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault(); this.cheatsheetOpen.update(o => !o); return;
    }
    if (e.key === 'Escape') { this.cheatsheetOpen.set(false); }

    // Match registered shortcuts (combo like "ctrl+k", "shift+/")
    for (const s of this.shortcuts()) {
      if (this.matches(s.keys, e)) {
        if (inForm && !s.keys.startsWith('ctrl+') && !s.keys.startsWith('meta+')) continue;
        e.preventDefault(); s.run(); return;
      }
    }
  };

  private matches(combo: string, e: KeyboardEvent): boolean {
    const parts = combo.toLowerCase().split('+').map(p => p.trim());
    const need = { ctrl: false, meta: false, shift: false, alt: false, key: '' };
    for (const p of parts) {
      if (p === 'ctrl') need.ctrl = true;
      else if (p === 'meta' || p === 'cmd') need.meta = true;
      else if (p === 'shift') need.shift = true;
      else if (p === 'alt') need.alt = true;
      else need.key = p;
    }
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '');
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
    if (need.ctrl && !ctrlKey) return false;
    if (need.meta && !ctrlKey) return false;
    if (need.shift !== e.shiftKey) return false;
    if (need.alt !== e.altKey) return false;
    return e.key.toLowerCase() === need.key;
  }
}
