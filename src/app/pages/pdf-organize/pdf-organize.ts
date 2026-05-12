import { Component, inject, signal } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';
import { PdfRenderService } from '../../shared/pdf-render.service';

@Component({
  selector: 'app-pdf-organize',
  imports: [Dropzone, PageHeader],
  template: `
    <app-page-header title="Organize PDF" subtitle="Reorder, duplicate or delete pages — then export a fresh PDF." icon="⋮⋮" color="from-violet-500 to-purple-600" />

    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="card p-5" data-no-drop>
          <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center text-white font-bold">PDF</div>
              <div>
                <div class="font-semibold">{{ file()!.name }}</div>
                <div class="text-xs text-slate-500">{{ order().length }} of {{ total() }} pages selected</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn-secondary" (click)="reverse()">Reverse</button>
              <button class="btn-secondary" (click)="reset()">Change file</button>
            </div>
          </div>

          @if (rendering()) {
            <div class="text-xs text-slate-500 mb-3">Rendering previews… {{ progress() }} / {{ total() }}</div>
          }

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            @for (n of order(); track $index; let i = $index) {
              <div
                class="relative group rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 aspect-[3/4] overflow-hidden cursor-move hover:border-brand-500 hover:shadow-lg transition"
                draggable="true"
                (dragstart)="dragIdx.set(i)"
                (dragover)="$event.preventDefault()"
                (drop)="dropAt(i)">
                @if (thumbAt(n); as src) {
                  <img [src]="src" class="absolute inset-0 w-full h-full object-contain" alt="Page {{ n + 1 }}" />
                } @else {
                  <div class="absolute inset-0 grid place-items-center text-3xl font-display font-bold text-slate-300">{{ n + 1 }}</div>
                }
                <div class="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-semibold">
                  #{{ i + 1 }} · p{{ n + 1 }}
                </div>
                <div class="absolute bottom-1 left-1 right-1 flex justify-between text-xs">
                  <button class="px-1.5 py-0.5 rounded bg-white/95 dark:bg-slate-900/95 shadow text-slate-700 dark:text-slate-200" (click)="dup(i)">Dup</button>
                  <button class="px-1.5 py-0.5 rounded bg-rose-500 text-white shadow" (click)="del(i)">Del</button>
                </div>
              </div>
            }
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button class="btn-primary" (click)="run()" [disabled]="busy() || !order().length">
              @if (busy()) { Building… } @else { Apply & download }
            </button>
          </div>
          @if (error()) { <div class="mt-3 text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfOrganize {
  private renderer = inject(PdfRenderService);

  protected file = signal<File | null>(null);
  protected total = signal(0);
  protected order = signal<number[]>([]);
  protected busy = signal(false);
  protected rendering = signal(false);
  protected progress = signal(0);
  protected error = signal('');
  protected dragIdx = signal<number | null>(null);
  protected thumbs = signal<Record<number, string>>({});
  private bytes: ArrayBuffer | null = null;

  thumbAt(pageIndex: number): string | undefined {
    return this.thumbs()[pageIndex];
  }

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    this.thumbs.set({});
    try {
      const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const t = doc.getPageCount();
      this.total.set(t);
      this.order.set(Array.from({ length: t }, (_, i) => i));
      this.renderThumbs();
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to read PDF');
    }
  }

  private async renderThumbs() {
    if (!this.bytes) return;
    this.rendering.set(true);
    this.progress.set(0);
    try {
      const doc = await this.renderer.loadDoc(this.bytes);
      for (let i = 1; i <= doc.numPages; i++) {
        const r = await this.renderer.renderPageToDataUrl(doc, i, 0.5);
        this.thumbs.update(m => ({ ...m, [i - 1]: r.dataUrl }));
        this.progress.set(i);
      }
    } catch (e: any) {
      this.error.set('Preview failed: ' + (e?.message ?? 'unknown error'));
    } finally {
      this.rendering.set(false);
    }
  }

  reset() {
    this.file.set(null);
    this.bytes = null;
    this.order.set([]);
    this.thumbs.set({});
    this.error.set('');
  }
  reverse() { this.order.set([...this.order()].reverse()); }
  dup(i: number) { const a = [...this.order()]; a.splice(i + 1, 0, a[i]); this.order.set(a); }
  del(i: number) { this.order.set(this.order().filter((_, idx) => idx !== i)); }

  dropAt(target: number) {
    const from = this.dragIdx();
    if (from == null || from === target) return;
    const a = [...this.order()];
    const [moved] = a.splice(from, 1);
    a.splice(target, 0, moved);
    this.order.set(a);
    this.dragIdx.set(null);
  }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      const src = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, this.order());
      copied.forEach(p => out.addPage(p));
      const data = await out.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-organized.pdf');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed');
    } finally {
      this.busy.set(false);
    }
  }
}
