import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-image-convert',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Image Format Converter" subtitle="Convert between JPG, PNG, WebP and BMP — keeps quality intact." icon="↔" color="from-fuchsia-500 to-purple-600" back="/image" />
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) { <app-dropzone title="Drop an image" accept="image/*" (files)="pick($event)" /> }
      @else {
        <div class="card p-6 space-y-5">
          <img [src]="url()" class="max-h-72 mx-auto rounded-xl border border-slate-200 dark:border-slate-700" />
          <div>
            <label class="text-sm font-medium">Convert to</label>
            <select class="input mt-1" [(ngModel)]="format">
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
              <option value="image/bmp">BMP</option>
            </select>
          </div>
          <button class="btn-primary w-full" (click)="run()">Convert & download</button>
          <button class="btn-secondary w-full" (click)="reset()">Change image</button>
        </div>
      }
    </section>
  `,
})
export class ImageConvert {
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected format = 'image/png';

  pick(list: File[]) { const f = list[0]; if (!f) return; this.file.set(f); this.url.set(URL.createObjectURL(f)); }
  reset() { if (this.url()) URL.revokeObjectURL(this.url()); this.file.set(null); }
  async run() {
    const img = new Image(); img.src = this.url();
    await new Promise(res => img.onload = res);
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), this.format, 0.92));
    const ext = this.format.split('/')[1].replace('jpeg', 'jpg');
    saveAs(blob, (this.file()?.name ?? 'image').replace(/\.[^.]+$/, '') + '.' + ext);
  }
}
