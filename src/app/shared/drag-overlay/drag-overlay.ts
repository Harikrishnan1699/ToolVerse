import { Component, OnInit, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-drag-overlay',
  template: `
    @if (active() && enabled()) {
      <div class="fixed inset-0 z-[58] bg-brand-600/30 backdrop-blur-sm border-4 border-dashed border-brand-400 grid place-items-center pointer-events-none">
        <div class="text-center">
          <div class="text-7xl">📥</div>
          <div class="mt-3 text-2xl font-display font-bold text-white">Drop file to open it</div>
          <div class="text-sm text-white/80 mt-1">PDF · Image · Audio · Video</div>
        </div>
      </div>
    }
  `,
})
export class DragOverlay implements OnInit {
  private router = inject(Router);
  protected active = signal(false);
  protected enabled = signal(true);
  private counter = 0;

  ngOnInit() {
    if (typeof window === 'undefined') return;
    this.updateEnabled(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => this.updateEnabled((e as NavigationEnd).urlAfterRedirects));
    window.addEventListener('dragenter', this.onEnter);
    window.addEventListener('dragleave', this.onLeave);
    window.addEventListener('dragover', this.onOver);
    window.addEventListener('drop', this.onDrop);
  }

  private updateEnabled(url: string) {
    const path = (url.split('?')[0] || '/').replace(/\/+$/, '') || '/';
    const segments = path.split('/').filter(Boolean);
    this.enabled.set(segments.length <= 1);
    if (!this.enabled()) {
      this.active.set(false);
      this.counter = 0;
    }
  }

  private isOptedOut(target: EventTarget | null): boolean {
    const el = target as Element | null;
    return !!el?.closest?.('[data-no-drop]');
  }

  private onOver = (e: DragEvent) => {
    if (!this.enabled() || this.isOptedOut(e.target)) return;
    e.preventDefault();
  };

  private onEnter = (e: DragEvent) => {
    if (!this.enabled()) return;
    if (!e.dataTransfer?.types.includes('Files')) return;
    if (this.isOptedOut(e.target)) return;
    this.counter++;
    this.active.set(true);
  };

  private onLeave = (e: DragEvent) => {
    if (!this.enabled()) return;
    if (this.isOptedOut(e.target)) return;
    this.counter--;
    if (this.counter <= 0) { this.counter = 0; this.active.set(false); }
  };

  private onDrop = (e: DragEvent) => {
    if (!this.enabled() || this.isOptedOut(e.target)) {
      this.active.set(false); this.counter = 0;
      return;
    }
    e.preventDefault();
    this.active.set(false); this.counter = 0;
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (!files.length) return;
    (window as any).__tvIncomingFiles = files;
    const t = files[0].type;
    let route = '/';
    if (t.startsWith('application/pdf')) route = files.length > 1 ? '/pdf/merge' : '/pdf/compress';
    else if (t.startsWith('image/')) route = files.length > 1 ? '/pdf/images-to-pdf' : '/image/compress';
    else if (t.startsWith('audio/')) route = '/media/audio-convert';
    else if (t.startsWith('video/')) route = '/media/video-compress';
    else if (t === 'application/json') route = '/dev/json';
    this.router.navigateByUrl(route);
  };
}
