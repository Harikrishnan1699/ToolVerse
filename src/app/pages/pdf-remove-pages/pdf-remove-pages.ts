import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-remove-pages',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Remove pages" subtitle="Drop a PDF and pick the page numbers to delete." icon="✖" color="from-rose-500 to-red-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 grid place-items-center text-white font-bold">✖</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
              <div class="text-sm text-slate-500">{{ pages() }} pages</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>
          <div>
            <label class="text-sm font-medium">Pages to remove</label>
            <input class="input mt-1" placeholder="e.g. 2, 5-7, 10" [(ngModel)]="spec" />
            <p class="text-xs text-slate-500 mt-1">Total pages: {{ pages() }}</p>
          </div>
          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { Removing… } @else { Remove & download }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfRemovePages {
  protected file = signal<File | null>(null);
  protected pages = signal(0);
  protected spec = '';
  protected busy = signal(false);
  protected error = signal('');
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
    this.pages.set(doc.getPageCount());
  }
  reset() { this.file.set(null); this.bytes = null; }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      const total = this.pages();
      const removeSet = new Set(this.parse(this.spec, total));
      if (!removeSet.size) throw new Error('Pick at least one page to remove.');
      const keep = Array.from({ length: total }, (_, i) => i).filter(i => !removeSet.has(i));
      if (!keep.length) throw new Error('You can\'t remove every page.');
      const src = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, keep);
      copied.forEach(p => out.addPage(p));
      const data = await out.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-removed.pdf');
    } catch (e: any) { this.error.set(e?.message ?? 'Failed'); }
    finally { this.busy.set(false); }
  }

  private parse(spec: string, total: number): number[] {
    const out = new Set<number>();
    spec.split(',').forEach(part => {
      const t = part.trim(); if (!t) return;
      const m = t.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        const a = +m[1], b = +m[2];
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= total) out.add(i - 1);
      } else {
        const n = +t;
        if (Number.isInteger(n) && n >= 1 && n <= total) out.add(n - 1);
      }
    });
    return [...out];
  }
}
