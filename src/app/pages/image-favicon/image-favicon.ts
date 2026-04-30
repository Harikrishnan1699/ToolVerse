import { Component, signal } from '@angular/core';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-image-favicon',
  imports: [Dropzone, SectionHeader],
  template: `
    <app-section-header title="Favicon Generator" subtitle="Generate every favicon size you need from a single image." icon="✨" color="from-orange-500 to-amber-600" back="/image" />
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) { <app-dropzone title="Drop a square image" subtitle="512×512 or larger recommended" accept="image/*" (files)="pick($event)" /> }
      @else {
        <div class="card p-6 space-y-5">
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-3">
            @for (s of sizes; track s) {
              <div class="text-center">
                <canvas [id]="'fav-' + s" [width]="s" [height]="s" class="mx-auto rounded border border-slate-200 dark:border-slate-700" [style.width.px]="Math.min(s, 96)" [style.height.px]="Math.min(s, 96)"></canvas>
                <div class="text-xs text-slate-500 mt-1">{{ s }}×{{ s }}</div>
              </div>
            }
          </div>
          <div class="flex justify-center gap-2">
            <button class="btn-primary" (click)="downloadAll()">Download all PNG</button>
            <button class="btn-secondary" (click)="reset()">Change image</button>
          </div>
        </div>
      }
    </section>
  `,
})
export class ImageFavicon {
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected sizes = [16, 32, 48, 64, 128, 192, 256, 512];
  protected Math = Math;

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f); this.url.set(URL.createObjectURL(f));
    setTimeout(() => this.render(), 100);
  }
  reset() { if (this.url()) URL.revokeObjectURL(this.url()); this.file.set(null); }

  async render() {
    const img = new Image(); img.src = this.url();
    await new Promise(r => img.onload = r);
    this.sizes.forEach(s => {
      const c = document.getElementById('fav-' + s) as HTMLCanvasElement; if (!c) return;
      c.getContext('2d')!.drawImage(img, 0, 0, s, s);
    });
  }

  async downloadAll() {
    for (const s of this.sizes) {
      const c = document.getElementById('fav-' + s) as HTMLCanvasElement;
      const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/png'));
      saveAs(blob, `favicon-${s}x${s}.png`);
    }
  }
}
