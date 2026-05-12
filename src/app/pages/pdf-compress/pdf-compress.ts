import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-compress',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Compress PDF" subtitle="Re-encode and clean up your PDF to shrink its file size." icon="C" color="from-emerald-500 to-teal-500" />

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5" data-no-drop>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center text-white font-bold">C</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
              <div class="text-sm text-slate-500">{{ originalSize() }}</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>

          <div class="rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 p-4 text-sm text-amber-800 dark:text-amber-200">
            <strong>Heads up:</strong> client-side compression is lossless — it removes unused objects, deduplicates streams and rewrites the file. Best for PDFs created by software like Word/HTML; scanned PDFs need server-side image re-encoding (not done here).
          </div>

          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { Compressing… } @else { Compress & download }
          </button>

          @if (result()) {
            <div class="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <div class="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Done!</div>
              <div class="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                Original: {{ result()!.before }} · New: {{ result()!.after }} · Saved: {{ result()!.savedPct }}%
              </div>
            </div>
          }
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfCompress implements OnInit {
  ngOnInit() {
    const incoming = (window as any).__tvIncomingFiles as File[] | undefined;
    if (incoming?.length) {
      delete (window as any).__tvIncomingFiles;
      this.pick(incoming);
    }
  }
  protected file = signal<File | null>(null);
  protected originalSize = signal('');
  protected busy = signal(false);
  protected error = signal('');
  protected result = signal<{before: string; after: string; savedPct: number} | null>(null);
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.originalSize.set(this.fmt(f.size));
    this.bytes = await f.arrayBuffer();
  }
  reset() { this.file.set(null); this.bytes = null; this.result.set(null); }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set(''); this.result.set(null);
    try {
      const src = await PDFDocument.load(this.bytes, { updateMetadata: false, ignoreEncryption: true });
      const out = await PDFDocument.create();
      out.setTitle(src.getTitle() ?? '');
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach(p => out.addPage(p));
      const data = await out.save({ useObjectStreams: true });
      const before = this.bytes.byteLength;
      const after = data.byteLength;
      const saved = Math.max(0, Math.round((1 - after / before) * 100));
      this.result.set({ before: this.fmt(before), after: this.fmt(after), savedPct: saved });
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-compressed.pdf');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed');
    } finally {
      this.busy.set(false);
    }
  }

  private fmt(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }
}
