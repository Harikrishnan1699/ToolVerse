import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-split',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Split PDF" subtitle="Extract page ranges or split every page into a separate PDF." icon="S" color="from-rose-500 to-pink-500" />

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF here" subtitle="Pick a single PDF to split" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 grid place-items-center text-white font-bold">PDF</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
              <div class="text-sm text-slate-500">{{ pages() }} pages</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>

          <div>
            <div class="text-sm font-medium mb-2">Split mode</div>
            <div class="grid grid-cols-2 gap-3">
              <button class="card p-4 text-left hover:shadow-glow transition" [class.ring-2]="mode()==='range'" [class.ring-brand-500]="mode()==='range'" (click)="mode.set('range')">
                <div class="font-semibold">By range</div>
                <div class="text-sm text-slate-500">e.g. 1-3, 5, 8-10</div>
              </button>
              <button class="card p-4 text-left hover:shadow-glow transition" [class.ring-2]="mode()==='each'" [class.ring-brand-500]="mode()==='each'" (click)="mode.set('each')">
                <div class="font-semibold">Each page</div>
                <div class="text-sm text-slate-500">One PDF per page (zipped result)</div>
              </button>
            </div>
          </div>

          @if (mode() === 'range') {
            <div>
              <label class="text-sm font-medium">Pages to extract</label>
              <input class="input mt-1" placeholder="1-3, 5, 8-10" [(ngModel)]="ranges" />
              <p class="text-xs text-slate-500 mt-1">Total pages: {{ pages() }}</p>
            </div>
          }

          <div class="flex items-center justify-end gap-3">
            <button class="btn-primary" (click)="run()" [disabled]="busy()">
              @if (busy()) { Splitting… } @else { Split & download }
            </button>
          </div>

          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfSplit {
  protected file = signal<File | null>(null);
  protected pages = signal(0);
  protected mode = signal<'range' | 'each'>('range');
  protected ranges = '';
  protected busy = signal(false);
  protected error = signal('');
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) {
    const f = list[0];
    if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
    this.pages.set(doc.getPageCount());
  }

  reset() { this.file.set(null); this.bytes = null; this.error.set(''); }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      if (this.mode() === 'range') {
        const indices = this.parseRanges(this.ranges, this.pages());
        if (!indices.length) throw new Error('Invalid page range.');
        const out = await PDFDocument.create();
        const src = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
        const copied = await out.copyPages(src, indices);
        copied.forEach(p => out.addPage(p));
        const data = await out.save();
        saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-split.pdf');
      } else {
        const src = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
        for (let i = 0; i < src.getPageCount(); i++) {
          const out = await PDFDocument.create();
          const [p] = await out.copyPages(src, [i]);
          out.addPage(p);
          const data = await out.save();
          saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), `page-${i + 1}.pdf`);
        }
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to split');
    } finally {
      this.busy.set(false);
    }
  }

  private parseRanges(spec: string, total: number): number[] {
    const out = new Set<number>();
    spec.split(',').forEach(part => {
      const t = part.trim();
      if (!t) return;
      const m = t.match(/^(\d+)\s*-\s*(\d+)$/);
      if (m) {
        const a = +m[1], b = +m[2];
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
          if (i >= 1 && i <= total) out.add(i - 1);
        }
      } else {
        const n = +t;
        if (Number.isInteger(n) && n >= 1 && n <= total) out.add(n - 1);
      }
    });
    return [...out].sort((a, b) => a - b);
  }
}
