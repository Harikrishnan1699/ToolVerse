import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

interface Box { page: number; x: number; y: number; w: number; h: number; }

@Component({
  selector: 'app-pdf-redact',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Redact PDF" subtitle="Black-out areas of a PDF — redactions are permanent in the new file." icon="█" color="from-slate-700 to-slate-900" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 grid place-items-center text-white">█</div>
            <div class="flex-1 min-w-0"><div class="font-semibold truncate">{{ file()!.name }}</div><div class="text-xs text-slate-500">{{ pages() }} pages</div></div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>

          <div>
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-semibold">Redaction boxes</h3>
              <button class="btn-secondary px-3 py-1.5 text-xs" (click)="addBox()">+ Add box</button>
            </div>
            @if (!boxes().length) {
              <p class="text-sm text-slate-500">No boxes yet. Click "Add box" and specify page + position (in % of page size).</p>
            }
            <div class="space-y-3">
              @for (b of boxes(); track $index; let i = $index) {
                <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label class="text-xs font-medium">Page</label>
                    <input type="number" [min]="1" [max]="pages()" class="input mt-1" [(ngModel)]="b.page" />
                  </div>
                  <div>
                    <label class="text-xs font-medium">X %</label>
                    <input type="number" min="0" max="100" class="input mt-1" [(ngModel)]="b.x" />
                  </div>
                  <div>
                    <label class="text-xs font-medium">Y % (from bottom)</label>
                    <input type="number" min="0" max="100" class="input mt-1" [(ngModel)]="b.y" />
                  </div>
                  <div>
                    <label class="text-xs font-medium">Width %</label>
                    <input type="number" min="1" max="100" class="input mt-1" [(ngModel)]="b.w" />
                  </div>
                  <div>
                    <label class="text-xs font-medium">Height %</label>
                    <input type="number" min="1" max="100" class="input mt-1" [(ngModel)]="b.h" />
                  </div>
                  <button class="btn-ghost text-rose-600 text-sm" (click)="removeBox(i)">Remove</button>
                </div>
              }
            </div>
          </div>

          <button class="btn-primary" (click)="run()" [disabled]="busy() || !boxes().length">
            @if (busy()) { Redacting… } @else { Redact & download }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfRedact {
  protected file = signal<File | null>(null);
  protected pages = signal(0);
  protected boxes = signal<Box[]>([]);
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
  reset() { this.file.set(null); this.bytes = null; this.boxes.set([]); }

  addBox() { this.boxes.update(arr => [...arr, { page: 1, x: 10, y: 80, w: 30, h: 5 }]); }
  removeBox(i: number) { this.boxes.update(arr => arr.filter((_, idx) => idx !== i)); }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      this.boxes().forEach(b => {
        const idx = (+b.page) - 1;
        if (idx < 0 || idx >= doc.getPageCount()) return;
        const page = doc.getPage(idx);
        const { width, height } = page.getSize();
        page.drawRectangle({
          x: width * (+b.x) / 100,
          y: height * (+b.y) / 100,
          width: width * (+b.w) / 100,
          height: height * (+b.h) / 100,
          color: rgb(0, 0, 0),
        });
      });
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-redacted.pdf');
    } catch (e: any) { this.error.set(e?.message ?? 'Failed'); }
    finally { this.busy.set(false); }
  }
}
