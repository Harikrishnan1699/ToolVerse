import { Component, signal } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-unlock',
  imports: [Dropzone, PageHeader],
  template: `
    <app-page-header title="Unlock PDF" subtitle="Strip owner-password restrictions from a PDF (no user-password supported)." icon="🔓" color="from-lime-500 to-emerald-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a locked PDF" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-500 to-emerald-600 grid place-items-center text-white font-bold">🔓</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>
          <div class="rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 p-4 text-sm text-amber-800 dark:text-amber-200">
            Works for permission-restricted PDFs (printing/copying disabled). PDFs requiring a password to open cannot be unlocked without the password.
          </div>
          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { Unlocking… } @else { Unlock & download }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfUnlock {
  protected file = signal<File | null>(null);
  protected busy = signal(false);
  protected error = signal('');
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) { const f = list[0]; if (!f) return; this.file.set(f); this.bytes = await f.arrayBuffer(); }
  reset() { this.file.set(null); this.bytes = null; }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      const src = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, src.getPageIndices());
      copied.forEach(p => out.addPage(p));
      const data = await out.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-unlocked.pdf');
    } catch (e: any) { this.error.set('Could not unlock — the file may need a password to even open.'); }
    finally { this.busy.set(false); }
  }
}
