import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-image-resize',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Image Resizer" subtitle="Resize images to any dimension while preserving quality." icon="⤢" color="from-sky-500 to-blue-600" back="/image" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) { <app-dropzone title="Drop an image" accept="image/*" (files)="pick($event)" /> }
      @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <img [src]="url()" class="w-20 h-20 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
              <div class="text-xs text-slate-500">{{ origW() }} × {{ origH() }} px</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="text-sm font-medium">Width</label><input type="number" min="1" class="input mt-1" [(ngModel)]="w" (ngModelChange)="onW()" /></div>
            <div><label class="text-sm font-medium">Height</label><input type="number" min="1" class="input mt-1" [(ngModel)]="h" (ngModelChange)="onH()" /></div>
          </div>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="lock" /> Maintain aspect ratio</label>
          <div>
            <label class="text-sm font-medium">Format</label>
            <select class="input mt-1" [(ngModel)]="format">
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>
          <button class="btn-primary" (click)="download()">Resize & download</button>
        </div>
      }
    </section>
  `,
})
export class ImageResize {
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected origW = signal(0); protected origH = signal(0);
  protected w = 800; protected h = 600;
  protected lock = true; protected format = 'image/jpeg';

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f); this.url.set(URL.createObjectURL(f));
    const img = new Image(); img.src = this.url();
    await new Promise(res => img.onload = res);
    this.origW.set(img.naturalWidth); this.origH.set(img.naturalHeight);
    this.w = img.naturalWidth; this.h = img.naturalHeight;
  }
  reset() { if (this.url()) URL.revokeObjectURL(this.url()); this.file.set(null); }
  onW() { if (this.lock && this.origW()) this.h = Math.round(+this.w * this.origH() / this.origW()); }
  onH() { if (this.lock && this.origH()) this.w = Math.round(+this.h * this.origW() / this.origH()); }
  async download() {
    const img = new Image(); img.src = this.url();
    await new Promise(res => img.onload = res);
    const c = document.createElement('canvas'); c.width = +this.w; c.height = +this.h;
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), this.format, 0.92));
    const ext = this.format.split('/')[1].replace('jpeg', 'jpg');
    saveAs(blob, (this.file()?.name ?? 'image').replace(/\.[^.]+$/, '') + `-${this.w}x${this.h}.${ext}`);
  }
}
