import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

interface Img { file: File; url: string; }

@Component({
  selector: 'app-pdf-images',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Images to PDF" subtitle="Convert JPG / PNG / WEBP images into a single PDF document." icon="I" color="from-amber-500 to-orange-600" />

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (imgs().length === 0) {
        <app-dropzone title="Drop images" subtitle="JPG, PNG, WEBP — drag to reorder afterwards" [multiple]="true" accept="image/*" (files)="add($event)" />
      } @else {
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm text-slate-600 dark:text-slate-400">{{ imgs().length }} image(s)</div>
            <div class="flex gap-2">
              <label class="btn-secondary cursor-pointer">
                + Add more
                <input type="file" class="hidden" multiple accept="image/*" (change)="onAdd($event)" />
              </label>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            @for (im of imgs(); track im.url; let i = $index) {
              <div class="relative group">
                <img [src]="im.url" class="w-full h-40 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                <button class="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 text-white text-xs opacity-0 group-hover:opacity-100 transition" (click)="remove(i)">×</button>
                <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">{{ i + 1 }}</div>
              </div>
            }
          </div>

          <div class="mt-5 grid sm:grid-cols-3 gap-3">
            <div>
              <label class="text-sm font-medium">Page size</label>
              <select class="input mt-1" [(ngModel)]="pageSize">
                <option value="A4">A4</option>
                <option value="LETTER">Letter</option>
                <option value="FIT">Fit to image</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Orientation</label>
              <select class="input mt-1" [(ngModel)]="orientation">
                <option value="P">Portrait</option>
                <option value="L">Landscape</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Margin (px)</label>
              <input type="number" class="input mt-1" [(ngModel)]="margin" min="0" max="100" />
            </div>
          </div>

          <div class="mt-5 flex justify-end gap-3">
            <button class="btn-secondary" (click)="clear()">Clear</button>
            <button class="btn-primary" (click)="run()" [disabled]="busy()">
              @if (busy()) { Building… } @else { Build PDF & download }
            </button>
          </div>
          @if (error()) { <div class="mt-3 text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfImages {
  protected imgs = signal<Img[]>([]);
  protected pageSize = 'A4';
  protected orientation = 'P';
  protected margin = 24;
  protected busy = signal(false);
  protected error = signal('');

  add(list: File[]) {
    const allowed = list.filter(f => f.type.startsWith('image/'));
    this.imgs.update(arr => [...arr, ...allowed.map(f => ({ file: f, url: URL.createObjectURL(f) }))]);
  }

  onAdd(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) { this.add(Array.from(input.files)); input.value = ''; }
  }

  remove(i: number) {
    URL.revokeObjectURL(this.imgs()[i].url);
    this.imgs.update(arr => arr.filter((_, idx) => idx !== i));
  }

  clear() {
    this.imgs().forEach(i => URL.revokeObjectURL(i.url));
    this.imgs.set([]);
  }

  async run() {
    if (!this.imgs().length) return;
    this.busy.set(true); this.error.set('');
    try {
      const doc = await PDFDocument.create();
      const sizes: Record<string, [number, number]> = { A4: [595.28, 841.89], LETTER: [612, 792] };
      for (const im of this.imgs()) {
        const buf = await im.file.arrayBuffer();
        const isPng = im.file.type.includes('png');
        let embed;
        if (isPng) embed = await doc.embedPng(buf);
        else if (im.file.type.includes('jpeg') || im.file.type.includes('jpg')) embed = await doc.embedJpg(buf);
        else {
          const dataUrl = await this.toJpeg(buf, im.file.type);
          embed = await doc.embedJpg(this.dataUrlToBytes(dataUrl));
        }

        let pw = embed.width, ph = embed.height;
        if (this.pageSize !== 'FIT') {
          [pw, ph] = sizes[this.pageSize];
          if (this.orientation === 'L') [pw, ph] = [ph, pw];
        }
        const page = doc.addPage([pw, ph]);
        const m = this.margin;
        const availW = pw - m * 2, availH = ph - m * 2;
        const r = Math.min(availW / embed.width, availH / embed.height, 1);
        const drawW = embed.width * r, drawH = embed.height * r;
        page.drawImage(embed, { x: (pw - drawW) / 2, y: (ph - drawH) / 2, width: drawW, height: drawH });
      }
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-images.pdf');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to build PDF');
    } finally {
      this.busy.set(false);
    }
  }

  private toJpeg(buf: ArrayBuffer, type: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d')!.drawImage(img, 0, 0);
        resolve(c.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = URL.createObjectURL(new Blob([buf], { type }));
    });
  }

  private dataUrlToBytes(d: string): Uint8Array {
    const b64 = d.split(',')[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return arr;
  }
}
