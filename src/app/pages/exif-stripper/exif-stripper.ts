import { Component, signal } from '@angular/core';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

interface Item { file: File; cleaned?: Blob; before: number; after?: number; }

@Component({
  selector: 'app-exif-stripper',
  imports: [Dropzone, SectionHeader],
  template: `
    <app-section-header title="EXIF Stripper" subtitle="Remove GPS, camera and metadata from photos before sharing. 100% local." icon="🛡" color="from-emerald-500 to-teal-600" back="/" backLabel="Home" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!items().length) {
        <app-dropzone title="Drop images here" subtitle="JPG, PNG, WebP — multiple files supported" [multiple]="true" accept="image/*" (files)="add($event)" />
      } @else {
        <div class="card p-5" data-no-drop>
          <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div class="text-sm">{{ items().length }} image(s)</div>
            <div class="flex gap-2">
              <label class="btn-secondary cursor-pointer text-sm">
                + Add more
                <input type="file" class="hidden" multiple accept="image/*" (change)="onPick($event)" />
              </label>
              <button class="btn-secondary text-sm" (click)="clear()">Clear</button>
              <button class="btn-primary text-sm" (click)="run()" [disabled]="busy()">
                @if (busy()) { Stripping… } @else { 🛡 Strip metadata }
              </button>
              @if (anyDone()) {
                <button class="btn-secondary text-sm" (click)="downloadAll()">⬇ Download all</button>
              }
            </div>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (it of items(); track $index; let i = $index) {
              <div class="card p-3">
                <img [src]="preview(it.file)" class="w-full h-40 object-cover rounded-lg" />
                <div class="mt-2 text-xs truncate font-medium">{{ it.file.name }}</div>
                <div class="text-[10px] text-slate-500 mt-0.5">
                  Before: {{ fmt(it.before) }}
                  @if (it.after != null) { · After: {{ fmt(it.after) }} ({{ delta(it) }}%) }
                </div>
                <div class="flex gap-1 mt-2">
                  @if (it.cleaned) {
                    <button class="btn-primary text-xs w-full" (click)="download(it)">⬇ Download</button>
                  }
                  <button class="btn-ghost text-rose-600 text-xs" (click)="remove(i)">✕</button>
                </div>
              </div>
            }
          </div>

          <div class="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-200">
            ✓ Stripping happens entirely in your browser via Canvas — every byte of EXIF (camera model, GPS coordinates, date, software) is dropped on re-encode.
          </div>
        </div>
      }
    </section>
  `,
})
export class ExifStripper {
  protected items = signal<Item[]>([]);
  protected busy = signal(false);
  private urls = new Map<File, string>();

  constructor(private toast: ToastService) {}

  add(list: File[]) {
    const next = list.filter(f => f.type.startsWith('image/'));
    this.items.update(arr => [...arr, ...next.map(f => ({ file: f, before: f.size }))]);
  }
  onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) { this.add(Array.from(input.files)); input.value = ''; }
  }
  remove(i: number) {
    const it = this.items()[i];
    if (it) { const u = this.urls.get(it.file); if (u) URL.revokeObjectURL(u); this.urls.delete(it.file); }
    this.items.update(arr => arr.filter((_, idx) => idx !== i));
  }
  clear() { this.urls.forEach(u => URL.revokeObjectURL(u)); this.urls.clear(); this.items.set([]); }

  preview(f: File): string {
    let url = this.urls.get(f);
    if (!url) { url = URL.createObjectURL(f); this.urls.set(f, url); }
    return url;
  }

  async run() {
    this.busy.set(true);
    try {
      const updated: Item[] = [];
      for (const it of this.items()) {
        const cleaned = await this.strip(it.file);
        updated.push({ ...it, cleaned, after: cleaned.size });
      }
      this.items.set(updated);
      this.toast.success('Metadata removed');
    } finally {
      this.busy.set(false);
    }
  }

  private strip(f: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const isPng = f.type.includes('png');
        c.toBlob(b => b ? resolve(b) : reject(new Error('encode')), isPng ? 'image/png' : 'image/jpeg', 0.95);
      };
      img.onerror = () => reject(new Error('decode'));
      img.src = URL.createObjectURL(f);
    });
  }

  anyDone() { return this.items().some(i => !!i.cleaned); }

  download(it: Item) {
    if (!it.cleaned) return;
    const ext = it.file.type.includes('png') ? '.png' : '.jpg';
    const base = it.file.name.replace(/\.(jpg|jpeg|png|webp)$/i, '');
    saveAs(it.cleaned, `${base}-clean${ext}`);
  }
  downloadAll() {
    for (const it of this.items()) if (it.cleaned) this.download(it);
  }

  fmt(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }
  delta(it: Item) {
    if (it.after == null) return 0;
    return Math.round(((it.before - it.after) / it.before) * 100);
  }
}
