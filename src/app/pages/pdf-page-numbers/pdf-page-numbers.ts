import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';
import { PdfRenderService } from '../../shared/pdf-render.service';

type Pos = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';

@Component({
  selector: 'app-pdf-page-numbers',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Page numbers" subtitle="Add page numbers in any corner — customise format and font." icon="#" color="from-indigo-500 to-blue-600" />

    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-6" data-no-drop>
          <div class="card p-6 space-y-5">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 grid place-items-center text-white font-bold">#</div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">{{ file()!.name }}</div>
                <div class="text-xs text-slate-500">{{ totalPages() }} pages</div>
              </div>
              <button class="btn-secondary" (click)="reset()">Change</button>
            </div>

            <div>
              <label class="text-sm font-medium">Position</label>
              <div class="grid grid-cols-3 gap-2 mt-2 max-w-md">
                @for (p of positions; track p.id) {
                  <button class="card p-3 text-sm hover:shadow-glow transition" [class.ring-2]="pos()===p.id" [class.ring-brand-500]="pos()===p.id" (click)="pos.set(p.id)">{{ p.label }}</button>
                }
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">Format</label>
                <input class="input mt-1" [(ngModel)]="format" (ngModelChange)="formatSig.set($event)" placeholder="{n} of {total}" />
                <p class="text-xs text-slate-500 mt-1">Use {{ '{n}' }} and {{ '{total}' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium">Font size</label>
                <input type="number" class="input mt-1" [(ngModel)]="size" (ngModelChange)="sizeSig.set(+$event)" min="6" max="48" />
              </div>
            </div>

            <button class="btn-primary" (click)="run()" [disabled]="busy()">
              @if (busy()) { Numbering… } @else { Add page numbers }
            </button>
            @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
          </div>

          <div class="card p-6">
            <div class="text-sm font-semibold mb-3">Live preview (page 1)</div>
            <div class="relative rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden grid place-items-center" style="min-height: 420px;">
              @if (previewUrl()) {
                <div class="relative inline-block">
                  <img [src]="previewUrl()!" class="block max-h-[500px] w-auto" alt="Preview" />
                  <div class="absolute pointer-events-none font-semibold text-slate-800"
                       [style.fontSize.px]="sizeSig()"
                       [style.top]="overlayStyle().top"
                       [style.bottom]="overlayStyle().bottom"
                       [style.left]="overlayStyle().left"
                       [style.right]="overlayStyle().right"
                       [style.transform]="overlayStyle().transform">
                    {{ previewText() }}
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
export class PdfPageNumbers {
  private renderer = inject(PdfRenderService);

  protected file = signal<File | null>(null);
  protected totalPages = signal(0);
  protected pos = signal<Pos>('br');
  protected format = '{n} / {total}';
  protected size = 12;
  protected formatSig = signal('{n} / {total}');
  protected sizeSig = signal(12);
  protected busy = signal(false);
  protected error = signal('');
  protected previewUrl = signal<string | null>(null);
  protected positions = [
    { id: 'tl' as Pos, label: '↖ Top-left' },{ id: 'tc' as Pos, label: '↑ Top-center' },{ id: 'tr' as Pos, label: '↗ Top-right' },
    { id: 'bl' as Pos, label: '↙ Bot-left' },{ id: 'bc' as Pos, label: '↓ Bot-center' },{ id: 'br' as Pos, label: '↘ Bot-right' },
  ];
  protected previewText = computed(() => {
    return this.formatSig().replace('{n}', '1').replace('{total}', String(this.totalPages() || 1));
  });
  protected overlayStyle = computed(() => {
    const m = '8px';
    switch (this.pos()) {
      case 'tl': return { top: m, left: m, right: 'auto', bottom: 'auto', transform: 'none' };
      case 'tc': return { top: m, left: '50%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)' };
      case 'tr': return { top: m, left: 'auto', right: m, bottom: 'auto', transform: 'none' };
      case 'bl': return { top: 'auto', left: m, right: 'auto', bottom: m, transform: 'none' };
      case 'bc': return { top: 'auto', left: '50%', right: 'auto', bottom: m, transform: 'translateX(-50%)' };
      case 'br': return { top: 'auto', left: 'auto', right: m, bottom: m, transform: 'none' };
    }
  });
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
    this.totalPages.set(doc.getPageCount());
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
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const total = doc.getPageCount();
      doc.getPages().forEach((page, i) => {
        const txt = this.format.replace('{n}', String(i + 1)).replace('{total}', String(total));
        const { width, height } = page.getSize();
        const tw = font.widthOfTextAtSize(txt, this.size);
        const margin = 24;
        let x = margin, y = margin;
        const top = height - margin - this.size;
        switch (this.pos()) {
          case 'tl': y = top; x = margin; break;
          case 'tc': y = top; x = (width - tw) / 2; break;
          case 'tr': y = top; x = width - tw - margin; break;
          case 'bl': y = margin; x = margin; break;
          case 'bc': y = margin; x = (width - tw) / 2; break;
          case 'br': y = margin; x = width - tw - margin; break;
        }
        page.drawText(txt, { x, y, size: this.size, font, color: rgb(0.2, 0.2, 0.2) });
      });
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-numbered.pdf');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed');
    } finally {
      this.busy.set(false);
    }
  }
}
