import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-drag-overlay',
  template: `
    @if (active()) {
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
  private counter = 0;

  ngOnInit() {
    if (typeof window === 'undefined') return;
    window.addEventListener('dragenter', this.onEnter);
    window.addEventListener('dragleave', this.onLeave);
    window.addEventListener('dragover', e => e.preventDefault());
    window.addEventListener('drop', this.onDrop);
  }

  private onEnter = (e: DragEvent) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    this.counter++;
    this.active.set(true);
  };
  private onLeave = () => {
    this.counter--;
    if (this.counter <= 0) { this.counter = 0; this.active.set(false); }
  };

  private onDrop = (e: DragEvent) => {
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
