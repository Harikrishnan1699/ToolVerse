import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

type Pos = 'tl' | 'tc' | 'tr' | 'bl' | 'bc' | 'br';

@Component({
  selector: 'app-pdf-page-numbers',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Page numbers" subtitle="Add page numbers in any corner — customise format and font." icon="#" color="from-indigo-500 to-blue-600" />

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" subtitle="Single file" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 grid place-items-center text-white font-bold">#</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
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
              <input class="input mt-1" [(ngModel)]="format" placeholder="{n} of {total}" />
              <p class="text-xs text-slate-500 mt-1">Use {{ '{n}' }} and {{ '{total}' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium">Font size</label>
              <input type="number" class="input mt-1" [(ngModel)]="size" min="6" max="48" />
            </div>
          </div>

          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { Numbering… } @else { Add page numbers }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfPageNumbers {
  protected file = signal<File | null>(null);
  protected pos = signal<Pos>('br');
  protected format = '{n} / {total}';
  protected size = 12;
  protected busy = signal(false);
  protected error = signal('');
  protected positions = [
    { id: 'tl' as Pos, label: '↖ Top-left' },{ id: 'tc' as Pos, label: '↑ Top-center' },{ id: 'tr' as Pos, label: '↗ Top-right' },
    { id: 'bl' as Pos, label: '↙ Bot-left' },{ id: 'bc' as Pos, label: '↓ Bot-center' },{ id: 'br' as Pos, label: '↘ Bot-right' },
  ];
  private bytes: ArrayBuffer | null = null;

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
  }
  reset() { this.file.set(null); this.bytes = null; }

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
