import { Component, signal } from '@angular/core';
import { PDFDocument, ParseSpeeds } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-repair',
  imports: [Dropzone, PageHeader],
  template: `
    <app-page-header title="Repair PDF" subtitle="Recover & rewrite a damaged PDF, skipping invalid objects." icon="🛠" color="from-emerald-500 to-green-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a damaged PDF" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5" data-no-drop>
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 grid place-items-center text-white">🛠</div>
            <div class="flex-1 min-w-0"><div class="font-semibold truncate">{{ file()!.name }}</div></div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>
          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { Repairing… } @else { Repair & download }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
          @if (success()) { <div class="text-sm text-emerald-600">Done. Recovered {{ success() }} pages.</div> }
        </div>
      }
    </section>
  `,
})
export class PdfRepair {
  protected file = signal<File | null>(null);
  protected busy = signal(false);
  protected error = signal('');
  protected success = signal(0);
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) { const f = list[0]; if (!f) return; this.file.set(f); this.bytes = await f.arrayBuffer(); }
  reset() { this.file.set(null); this.bytes = null; this.success.set(0); }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set(''); this.success.set(0);
    try {
      const src = await PDFDocument.load(this.bytes, { ignoreEncryption: true, throwOnInvalidObject: false, parseSpeed: ParseSpeeds.Slow });
      const out = await PDFDocument.create();
      let recovered = 0;
      const indices = src.getPageIndices();
      for (const i of indices) {
        try {
          const [p] = await out.copyPages(src, [i]);
          out.addPage(p);
          recovered++;
        } catch { /* skip bad page */ }
      }
      if (!recovered) throw new Error('No recoverable pages found.');
      const data = await out.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-repaired.pdf');
      this.success.set(recovered);
    } catch (e: any) { this.error.set(e?.message ?? 'Could not repair.'); }
    finally { this.busy.set(false); }
  }
}
