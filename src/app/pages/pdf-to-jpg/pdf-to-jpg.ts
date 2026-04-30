import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-to-jpg',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="PDF to JPG" subtitle="Render every page of a PDF as a high-quality JPG image." icon="🖼" color="from-yellow-500 to-orange-500" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 grid place-items-center text-white">🖼</div>
            <div class="flex-1 min-w-0"><div class="font-semibold truncate">{{ file()!.name }}</div></div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>

          <div class="grid sm:grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Quality (DPI scale)</label>
              <select class="input mt-1" [(ngModel)]="scale">
                <option [ngValue]="1">Standard (72 DPI)</option>
                <option [ngValue]="2">High (144 DPI)</option>
                <option [ngValue]="3">Best (216 DPI)</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Format</label>
              <select class="input mt-1" [(ngModel)]="format">
                <option value="image/jpeg">JPG</option>
                <option value="image/png">PNG</option>
              </select>
            </div>
          </div>

          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { Rendering page {{ progress() }}… } @else { Convert & download }
          </button>

          @if (thumbs().length) {
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              @for (t of thumbs(); track t.url) {
                <a [href]="t.url" [download]="t.name" class="group">
                  <img [src]="t.url" class="w-full rounded-xl border border-slate-200 dark:border-slate-700 group-hover:opacity-80 transition" />
                  <div class="mt-1 text-xs text-center text-slate-500">{{ t.name }}</div>
                </a>
              }
            </div>
          }

          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfToJpg {
  protected file = signal<File | null>(null);
  protected scale = 2;
  protected format = 'image/jpeg';
  protected busy = signal(false);
  protected progress = signal(0);
  protected error = signal('');
  protected thumbs = signal<{ url: string; name: string }[]>([]);
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) { const f = list[0]; if (!f) return; this.file.set(f); this.bytes = await f.arrayBuffer(); }
  reset() {
    this.thumbs().forEach(t => URL.revokeObjectURL(t.url));
    this.file.set(null); this.bytes = null; this.thumbs.set([]);
  }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set(''); this.progress.set(0);
    this.thumbs().forEach(t => URL.revokeObjectURL(t.url)); this.thumbs.set([]);
    try {
      const pdfjs: any = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url' as any)).default
        ?? new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

      const pdf = await pdfjs.getDocument({ data: this.bytes!.slice(0) }).promise;
      const ext = this.format === 'image/png' ? 'png' : 'jpg';
      const out: { url: string; name: string }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        this.progress.set(i);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: this.scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width; canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), this.format, 0.92));
        const name = `page-${i}.${ext}`;
        out.push({ url: URL.createObjectURL(blob), name });
        if (pdf.numPages <= 6) saveAs(blob, name);
      }
      this.thumbs.set(out);
      if (pdf.numPages > 6) {
        // bigger sets — let user click thumbnails to download individually
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to render');
    } finally {
      this.busy.set(false);
    }
  }
}
