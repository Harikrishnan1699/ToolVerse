import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';
import { PdfRenderService } from '../../shared/pdf-render.service';

@Component({
  selector: 'app-pdf-crop',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Crop PDF" subtitle="Trim margins from every page by a percentage." icon="✂" color="from-purple-500 to-fuchsia-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" (files)="pick($event)" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-6" data-no-drop>
          <div class="card p-6 space-y-5">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 grid place-items-center text-white">✂</div>
              <div class="flex-1 min-w-0"><div class="font-semibold truncate">{{ file()!.name }}</div></div>
              <button class="btn-secondary" (click)="reset()">Change</button>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">Top %</label>
                <input type="number" min="0" max="40" class="input mt-1" [(ngModel)]="top" />
              </div>
              <div>
                <label class="text-sm font-medium">Right %</label>
                <input type="number" min="0" max="40" class="input mt-1" [(ngModel)]="right" />
              </div>
              <div>
                <label class="text-sm font-medium">Bottom %</label>
                <input type="number" min="0" max="40" class="input mt-1" [(ngModel)]="bottom" />
              </div>
              <div>
                <label class="text-sm font-medium">Left %</label>
                <input type="number" min="0" max="40" class="input mt-1" [(ngModel)]="left" />
              </div>
            </div>

            <button class="btn-primary" (click)="run()" [disabled]="busy()">
              @if (busy()) { Cropping… } @else { Crop & download }
            </button>
            @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
          </div>

          <div class="card p-6">
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm font-semibold">Live preview</div>
              <div class="text-xs text-slate-500">Shaded area will be removed</div>
            </div>
            <div class="relative rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden grid place-items-center" style="min-height: 360px;">
              @if (previewUrl()) {
                <div class="relative">
                  <img [src]="previewUrl()!" class="block max-h-[500px] w-auto" alt="Preview" />
                  <div class="absolute inset-0 pointer-events-none">
                    <div class="absolute top-0 left-0 right-0 bg-rose-500/40" [style.height.%]="+top || 0"></div>
                    <div class="absolute bottom-0 left-0 right-0 bg-rose-500/40" [style.height.%]="+bottom || 0"></div>
                    <div class="absolute left-0 bg-rose-500/40" [style.top.%]="+top || 0" [style.bottom.%]="+bottom || 0" [style.width.%]="+left || 0"></div>
                    <div class="absolute right-0 bg-rose-500/40" [style.top.%]="+top || 0" [style.bottom.%]="+bottom || 0" [style.width.%]="+right || 0"></div>
                    <div class="absolute border-2 border-emerald-500 border-dashed"
                         [style.top.%]="+top || 0"
                         [style.left.%]="+left || 0"
                         [style.right.%]="+right || 0"
                         [style.bottom.%]="+bottom || 0"></div>
                  </div>
                </div>
              } @else {
                <div class="text-slate-500 text-sm">Loading preview…</div>
              }
            </div>
          </div>
        </div>
      }
    </section>
  `,
})
export class PdfCrop {
  private renderer = inject(PdfRenderService);

  protected file = signal<File | null>(null);
  protected top = 5; protected right = 5; protected bottom = 5; protected left = 5;
  protected busy = signal(false); protected error = signal('');
  protected previewUrl = signal<string | null>(null);
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    this.renderPreview();
  }

  private async renderPreview() {
    if (!this.bytes) return;
    try {
      const r = await this.renderer.renderFirstPage(this.bytes, 1);
      this.previewUrl.set(r.dataUrl);
    } catch (e: any) {
      this.error.set('Preview failed: ' + (e?.message ?? 'unknown error'));
    }
  }

  reset() { this.file.set(null); this.bytes = null; this.previewUrl.set(null); this.error.set(''); }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      doc.getPages().forEach(page => {
        const { width, height } = page.getSize();
        const x = width * (+this.left) / 100;
        const y = height * (+this.bottom) / 100;
        const w = width * (1 - (+this.left + +this.right) / 100);
        const h = height * (1 - (+this.top + +this.bottom) / 100);
        page.setCropBox(x, y, w, h);
        page.setMediaBox(x, y, w, h);
      });
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-cropped.pdf');
    } catch (e: any) { this.error.set(e?.message ?? 'Failed'); }
    finally { this.busy.set(false); }
  }
}
