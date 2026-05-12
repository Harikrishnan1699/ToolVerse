import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';
import { PdfRenderService } from '../../shared/pdf-render.service';

@Component({
  selector: 'app-pdf-extract-pages',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Extract pages" subtitle="Pull selected pages out into a new PDF." icon="↗" color="from-orange-500 to-rose-500" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5" data-no-drop>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 grid place-items-center text-white font-bold">↗</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
              <div class="text-sm text-slate-500">{{ pages() }} pages · {{ selectedCount() }} selected</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>

          <div>
            <label class="text-sm font-medium">Pages to extract</label>
            <input class="input mt-1" placeholder="e.g. 1-3, 5, 8-10" [(ngModel)]="spec" (ngModelChange)="syncFromSpec()" />
            <p class="text-xs text-slate-500 mt-1">Click thumbnails below to toggle pages — or type ranges above.</p>
          </div>

          @if (rendering()) {
            <div class="text-xs text-slate-500">Rendering thumbnails… {{ progress() }} / {{ pages() }}</div>
          }

          @if (thumbs().length) {
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-medium">Live preview</div>
                <div class="flex gap-2">
                  <button class="btn-ghost px-2 py-1 text-xs" (click)="selectAll()">All</button>
                  <button class="btn-ghost px-2 py-1 text-xs" (click)="selectNone()">None</button>
                </div>
              </div>
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                @for (t of thumbs(); track $index; let i = $index) {
                  <button type="button"
                    class="relative rounded-xl border-2 overflow-hidden aspect-[3/4] bg-white transition"
                    [class.border-brand-500]="isSelected(i)"
                    [class.ring-2]="isSelected(i)"
                    [class.ring-brand-300]="isSelected(i)"
                    [class.border-slate-200]="!isSelected(i)"
                    [class.dark:border-slate-700]="!isSelected(i)"
                    (click)="toggle(i)">
                    <img [src]="t" class="absolute inset-0 w-full h-full object-contain" alt="Page {{ i + 1 }}" />
                    <div class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">{{ i + 1 }}</div>
                    @if (isSelected(i)) {
                      <div class="absolute top-1 right-1 w-5 h-5 rounded-full bg-brand-500 text-white grid place-items-center text-[10px]">✓</div>
                    }
                  </button>
                }
              </div>
            </div>
          }

          <button class="btn-primary" (click)="run()" [disabled]="busy() || !selectedCount()">
            @if (busy()) { Extracting… } @else { Extract & download }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfExtractPages {
  private renderer = inject(PdfRenderService);

  protected file = signal<File | null>(null);
  protected pages = signal(0);
  protected spec = '';
  protected busy = signal(false);
  protected error = signal('');
  protected thumbs = signal<string[]>([]);
  protected rendering = signal(false);
  protected progress = signal(0);
  protected selected = signal<Set<number>>(new Set());
  protected selectedCount = computed(() => this.selected().size);
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
    this.pages.set(doc.getPageCount());
    this.selected.set(new Set());
    this.renderThumbs();
  }

  private async renderThumbs() {
    if (!this.bytes) return;
    this.rendering.set(true);
    this.progress.set(0);
    this.thumbs.set([]);
    try {
      const doc = await this.renderer.loadDoc(this.bytes);
      const out: string[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const r = await this.renderer.renderPageToDataUrl(doc, i, 0.5);
        out.push(r.dataUrl);
        this.thumbs.set([...out]);
        this.progress.set(i);
      }
    } catch (e: any) {
      this.error.set('Preview failed: ' + (e?.message ?? 'unknown error'));
    } finally {
      this.rendering.set(false);
    }
  }

  reset() { this.file.set(null); this.bytes = null; this.thumbs.set([]); this.selected.set(new Set()); this.error.set(''); }

  isSelected(i: number) { return this.selected().has(i); }

  toggle(i: number) {
    const s = new Set(this.selected());
    if (s.has(i)) s.delete(i); else s.add(i);
    this.selected.set(s);
    this.spec = this.compressRanges([...s].sort((a, b) => a - b));
  }

  selectAll() {
    const s = new Set<number>();
    for (let i = 0; i < this.pages(); i++) s.add(i);
    this.selected.set(s);
    this.spec = this.compressRanges([...s]);
  }

  selectNone() { this.selected.set(new Set()); this.spec = ''; }

  syncFromSpec() {
    const idxs = this.parse(this.spec, this.pages());
    this.selected.set(new Set(idxs));
  }

  private compressRanges(zeroIdx: number[]): string {
    if (!zeroIdx.length) return '';
    const sorted = [...zeroIdx].map(i => i + 1).sort((a, b) => a - b);
    const parts: string[] = [];
    let start = sorted[0], prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) { prev = sorted[i]; continue; }
      parts.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = sorted[i]; prev = sorted[i];
    }
    parts.push(start === prev ? `${start}` : `${start}-${prev}`);
    return parts.join(', ');
  }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      const total = this.pages();
      const indices = this.parse(this.spec, total);
      if (!indices.length) throw new Error('Pick at least one page.');
      const src = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, indices);
      copied.forEach(p => out.addPage(p));
      const data = await out.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-extracted.pdf');
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
    return [...out].sort((a, b) => a - b);
  }
}
