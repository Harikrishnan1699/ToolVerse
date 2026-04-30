import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-image-compress',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Image Compressor" subtitle="Shrink JPG, PNG and WebP using the browser's Canvas — fully client-side." icon="🗜" color="from-emerald-500 to-teal-600" back="/image" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) { <app-dropzone title="Drop an image" accept="image/*" (files)="pick($event)" /> }
      @else {
        <div class="grid lg:grid-cols-2 gap-5">
          <div class="card p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-semibold text-slate-500 uppercase">Original ({{ originalSize() }})</div>
              <button class="btn-secondary text-xs" (click)="reset()">Change</button>
            </div>
            <img [src]="url()" class="w-full rounded-xl border border-slate-200 dark:border-slate-700" />
            <div>
              <label class="text-xs font-semibold">Quality: {{ quality }}%</label>
              <input type="range" min="10" max="100" class="w-full" [(ngModel)]="quality" (ngModelChange)="run()" />
            </div>
            <div>
              <label class="text-xs font-semibold">Output format</label>
              <select class="input mt-1" [(ngModel)]="format" (ngModelChange)="run()">
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
          </div>
          <div class="card p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-semibold text-emerald-600 uppercase">Compressed ({{ resultSize() }} · saved {{ saved() }}%)</div>
              <button class="btn-ghost text-xs px-2 py-1" (click)="download()" [disabled]="!resultUrl()">Download</button>
            </div>
            @if (resultUrl()) { <img [src]="resultUrl()" class="w-full rounded-xl border border-slate-200 dark:border-slate-700" /> }
          </div>
        </div>
      }
    </section>
  `,
})
export class ImageCompress {
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected resultUrl = signal('');
  protected originalSize = signal('');
  protected resultSize = signal('');
  protected saved = signal(0);
  protected quality = 75;
  protected format = 'image/jpeg';
  private resultBlob: Blob | null = null;

  pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f); this.url.set(URL.createObjectURL(f));
    this.originalSize.set(this.fmt(f.size));
    this.run();
  }
  reset() { if (this.url()) URL.revokeObjectURL(this.url()); if (this.resultUrl()) URL.revokeObjectURL(this.resultUrl()); this.file.set(null); this.url.set(''); this.resultUrl.set(''); }

  async run() {
    if (!this.file()) return;
    const img = new Image();
    img.src = this.url();
    await new Promise(res => img.onload = res);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), this.format, this.quality / 100));
    this.resultBlob = blob;
    if (this.resultUrl()) URL.revokeObjectURL(this.resultUrl());
    this.resultUrl.set(URL.createObjectURL(blob));
    this.resultSize.set(this.fmt(blob.size));
    this.saved.set(Math.max(0, Math.round((1 - blob.size / this.file()!.size) * 100)));
  }
  download() {
    if (!this.resultBlob) return;
    const ext = this.format.split('/')[1].replace('jpeg', 'jpg');
    saveAs(this.resultBlob, (this.file()?.name ?? 'image').replace(/\.[^.]+$/, '') + '-compressed.' + ext);
  }
  private fmt(b: number) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB'; }
}
