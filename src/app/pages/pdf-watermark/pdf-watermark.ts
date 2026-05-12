import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';
import { PdfRenderService } from '../../shared/pdf-render.service';

@Component({
  selector: 'app-pdf-watermark',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Watermark PDF" subtitle="Stamp text across every page — diagonal or horizontal." icon="W" color="from-fuchsia-500 to-pink-600" />

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-6" data-no-drop>
          <div class="card p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 grid place-items-center text-white font-bold">PDF</div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">{{ file()!.name }}</div>
              </div>
              <button class="btn-secondary" (click)="reset()">Change</button>
            </div>

            <div>
              <label class="text-sm font-medium">Watermark text</label>
              <input class="input mt-1" [(ngModel)]="text" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">Font size</label>
                <input type="number" min="10" max="200" class="input mt-1" [(ngModel)]="size" />
              </div>
              <div>
                <label class="text-sm font-medium">Opacity</label>
                <input type="number" min="0.05" max="1" step="0.05" class="input mt-1" [(ngModel)]="opacity" />
              </div>
            </div>
            <div>
              <label class="text-sm font-medium">Color</label>
              <input type="color" class="mt-1 h-10 w-20 rounded-lg border border-slate-200 dark:border-slate-700" [(ngModel)]="color" />
            </div>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" [(ngModel)]="diagonal" /> Diagonal (45°)
            </label>

            <button class="btn-primary w-full" (click)="run()" [disabled]="busy()">
              @if (busy()) { Stamping… } @else { Add watermark & download }
            </button>
            @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
          </div>

          <div class="card p-6">
            <div class="text-sm font-semibold mb-3">Live preview (page 1)</div>
            <div class="relative rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden grid place-items-center" style="min-height: 420px;">
              @if (previewUrl()) {
                <div class="relative inline-block">
                  <img [src]="previewUrl()!" class="block max-h-[500px] w-auto" alt="Preview" />
                  <div class="absolute inset-0 grid place-items-center pointer-events-none">
                    <div [style.color]="color" [style.opacity]="opacity" [style.fontSize.px]="size/2" [style.transform]="diagonal ? 'rotate(-45deg)' : 'none'" class="font-bold whitespace-nowrap select-none">
                      {{ text || 'Watermark' }}
                    </div>
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
export class PdfWatermark {
  private renderer = inject(PdfRenderService);

  protected file = signal<File | null>(null);
  protected text = 'CONFIDENTIAL';
  protected size = 60;
  protected opacity = 0.3;
  protected color = '#ff0066';
  protected diagonal = true;
  protected busy = signal(false);
  protected error = signal('');
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

  reset() { this.file.set(null); this.bytes = null; this.previewUrl.set(null); }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const c = this.hex(this.color);
      doc.getPages().forEach(page => {
        const { width, height } = page.getSize();
        const w = font.widthOfTextAtSize(this.text, this.size);
        const x = (width - w) / 2;
        const y = height / 2;
        page.drawText(this.text, {
          x, y,
          size: this.size,
          font,
          color: rgb(c.r, c.g, c.b),
          opacity: this.opacity,
          rotate: this.diagonal ? degrees(45) : degrees(0),
        });
      });
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-watermarked.pdf');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to stamp');
    } finally {
      this.busy.set(false);
    }
  }

  private hex(h: string) {
    const v = h.replace('#', '');
    return { r: parseInt(v.slice(0, 2), 16) / 255, g: parseInt(v.slice(2, 4), 16) / 255, b: parseInt(v.slice(4, 6), 16) / 255 };
  }
}
