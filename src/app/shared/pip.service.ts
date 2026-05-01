import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PipService {
  readonly active = signal(false);
  private win: Window | null = null;

  get supported() { return typeof window !== 'undefined' && 'documentPictureInPicture' in window; }

  async open(buildContent: (doc: Document) => HTMLElement, options: { width?: number; height?: number } = {}): Promise<Window | null> {
    if (!this.supported) return null;
    try {
      const win = await (window as any).documentPictureInPicture.requestWindow({
        width: options.width ?? 320, height: options.height ?? 200,
      });
      // Copy stylesheets so the floating window has Tailwind
      [...document.styleSheets].forEach(s => {
        try {
          const link = win.document.createElement('link');
          link.rel = 'stylesheet';
          link.href = (s as any).href ?? '';
          if (link.href) win.document.head.appendChild(link);
        } catch {}
      });
      const root = buildContent(win.document);
      win.document.body.style.margin = '0';
      win.document.body.style.background = '#0b1020';
      win.document.body.appendChild(root);
      win.addEventListener('pagehide', () => { this.active.set(false); this.win = null; });
      this.win = win;
      this.active.set(true);
      return win;
    } catch { return null; }
  }

  close(): void { this.win?.close(); this.win = null; this.active.set(false); }
}
