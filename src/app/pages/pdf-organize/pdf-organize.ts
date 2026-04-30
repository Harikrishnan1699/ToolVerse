import { Component, signal } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-organize',
  imports: [Dropzone, PageHeader],
  template: `
    <app-page-header title="Organize PDF" subtitle="Reorder, duplicate or delete pages — then export a fresh PDF." icon="⋮⋮" color="from-violet-500 to-purple-600" />

    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
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

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            @for (n of order(); track $index; let i = $index) {
              <div
                class="relative group rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 aspect-[3/4] grid place-items-center cursor-move hover:border-brand-500 transition"
                draggable="true"
                (dragstart)="dragIdx.set(i)"
                (dragover)="$event.preventDefault()"
                (drop)="dropAt(i)">
                <div class="text-3xl font-display font-bold text-slate-400">{{ n + 1 }}</div>
                <div class="absolute bottom-1 left-1 right-1 flex justify-between text-xs">
                  <button class="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 shadow text-slate-700 dark:text-slate-200" (click)="dup(i)">Dup</button>
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
  protected file = signal<File | null>(null);
  protected total = signal(0);
  protected order = signal<number[]>([]);
  protected busy = signal(false);
  protected error = signal('');
  protected dragIdx = signal<number | null>(null);
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
    const t = doc.getPageCount();
    this.total.set(t);
    this.order.set(Array.from({ length: t }, (_, i) => i));
  }

  reset() { this.file.set(null); this.bytes = null; this.order.set([]); }
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
