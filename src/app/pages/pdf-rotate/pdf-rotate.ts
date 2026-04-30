import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-rotate',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Rotate PDF" subtitle="Rotate every page or specific pages by 90° / 180° / 270°." icon="↻" color="from-sky-500 to-blue-500" />

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 grid place-items-center text-white font-bold">PDF</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
              <div class="text-sm text-slate-500">{{ pages() }} pages</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>

          <div>
            <label class="text-sm font-medium">Rotation</label>
            <div class="grid grid-cols-3 gap-3 mt-1">
              @for (a of [90, 180, 270]; track a) {
                <button class="card p-4 text-center hover:shadow-glow transition" [class.ring-2]="angle()===a" [class.ring-brand-500]="angle()===a" (click)="angle.set(a)">
                  <div class="text-2xl font-display font-bold">{{ a }}°</div>
                  <div class="text-xs text-slate-500">{{ a===90?'Clockwise': a===180?'Upside down':'Counter-clockwise' }}</div>
                </button>
              }
            </div>
          </div>

          <div>
            <label class="text-sm font-medium">Pages (leave blank for all)</label>
            <input class="input mt-1" placeholder="1-3, 5" [(ngModel)]="rangeSpec" />
          </div>

          <div class="flex items-center justify-end gap-3">
            <button class="btn-primary" (click)="run()" [disabled]="busy()">
              @if (busy()) { Rotating… } @else { Rotate & download }
            </button>
          </div>

          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfRotate {
  protected file = signal<File | null>(null);
  protected pages = signal(0);
  protected angle = signal(90);
  protected rangeSpec = '';
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
      const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const total = doc.getPageCount();
      const targets = this.rangeSpec.trim()
        ? this.parseRanges(this.rangeSpec, total)
        : Array.from({ length: total }, (_, i) => i);
      targets.forEach(i => {
        const page = doc.getPage(i);
        const current = page.getRotation().angle || 0;
        page.setRotation(degrees((current + this.angle()) % 360));
      });
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-rotated.pdf');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to rotate');
    } finally {
      this.busy.set(false);
    }
  }

  private parseRanges(spec: string, total: number): number[] {
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
