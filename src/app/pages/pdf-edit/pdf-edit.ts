import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';
import { PdfRenderService } from '../../shared/pdf-render.service';

interface Anno { type: 'text' | 'rect'; page: number; x: number; y: number; w: number; h: number; text: string; size: number; color: string; }

@Component({
  selector: 'app-pdf-edit',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Edit PDF" subtitle="Add text labels or rectangles anywhere on a PDF." icon="✎" color="from-violet-500 to-indigo-600" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" (files)="pick($event)" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-6" data-no-drop>
          <div class="card p-6 space-y-5">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 grid place-items-center text-white">✎</div>
              <div class="flex-1 min-w-0"><div class="font-semibold truncate">{{ file()!.name }}</div><div class="text-xs text-slate-500">{{ pages() }} pages</div></div>
              <button class="btn-secondary" (click)="reset()">Change</button>
            </div>

            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold">Annotations</h3>
              <div class="flex gap-2">
                <button class="btn-secondary px-3 py-1.5 text-xs" (click)="addText()">+ Text</button>
                <button class="btn-secondary px-3 py-1.5 text-xs" (click)="addRect()">+ Rectangle</button>
              </div>
            </div>

            <div>
              <label class="text-sm font-medium">Preview page</label>
              <select class="input mt-1" [ngModel]="previewPage()" (ngModelChange)="previewPage.set(+$event); renderPreview()">
                @for (n of pageList(); track n) { <option [ngValue]="n">Page {{ n }}</option> }
              </select>
            </div>

            @if (!annos().length) {
              <p class="text-sm text-slate-500">Add text or shapes to draw on a page. Coordinates are in % of page size, Y is measured from the bottom.</p>
            }

            <div class="space-y-3">
              @for (a of annos(); track $index; let i = $index) {
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end">
                    <div>
                      <label class="text-xs font-medium">Type</label>
                      <input class="input mt-1" [value]="a.type" disabled />
                    </div>
                    <div>
                      <label class="text-xs font-medium">Page</label>
                      <input type="number" [min]="1" [max]="pages()" class="input mt-1" [(ngModel)]="a.page" (ngModelChange)="touch()" />
                    </div>
                    <div>
                      <label class="text-xs font-medium">X %</label>
                      <input type="number" class="input mt-1" [(ngModel)]="a.x" (ngModelChange)="touch()" />
                    </div>
                    <div>
                      <label class="text-xs font-medium">Y %</label>
                      <input type="number" class="input mt-1" [(ngModel)]="a.y" (ngModelChange)="touch()" />
                    </div>
                    @if (a.type === 'rect') {
                      <div>
                        <label class="text-xs font-medium">W %</label>
                        <input type="number" class="input mt-1" [(ngModel)]="a.w" (ngModelChange)="touch()" />
                      </div>
                      <div>
                        <label class="text-xs font-medium">H %</label>
                        <input type="number" class="input mt-1" [(ngModel)]="a.h" (ngModelChange)="touch()" />
                      </div>
                    } @else {
                      <div class="col-span-2">
                        <label class="text-xs font-medium">Size</label>
                        <input type="number" min="6" max="120" class="input mt-1" [(ngModel)]="a.size" (ngModelChange)="touch()" />
                      </div>
                    }
                  </div>
                  <div class="mt-3 grid grid-cols-2 gap-2">
                    @if (a.type === 'text') {
                      <div>
                        <label class="text-xs font-medium">Text</label>
                        <input class="input mt-1" [(ngModel)]="a.text" (ngModelChange)="touch()" />
                      </div>
                    }
                    <div>
                      <label class="text-xs font-medium">Color</label>
                      <input type="color" class="mt-1 h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700" [(ngModel)]="a.color" (ngModelChange)="touch()" />
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end">
                    <button class="btn-ghost text-rose-600 text-sm" (click)="remove(i)">Remove</button>
                  </div>
                </div>
              }
            </div>

            <button class="btn-primary" (click)="run()" [disabled]="busy() || !annos().length">
              @if (busy()) { Saving… } @else { Apply & download }
            </button>
            @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
          </div>

          <div class="card p-6">
            <div class="text-sm font-semibold mb-3">Live preview (page {{ previewPage() }})</div>
            <div class="relative rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden grid place-items-center" style="min-height: 420px;">
              @if (previewUrl()) {
                <div class="relative inline-block">
                  <img [src]="previewUrl()!" class="block max-h-[600px] w-auto" alt="Preview" />
                  <div class="absolute inset-0 pointer-events-none">
                    @for (a of pageAnnos(); track $index; let i = $index) {
                      @if (a.type === 'rect') {
                        <div class="absolute opacity-60"
                             [style.left.%]="a.x"
                             [style.bottom.%]="a.y"
                             [style.width.%]="a.w"
                             [style.height.%]="a.h"
                             [style.backgroundColor]="a.color"></div>
                      } @else {
                        <div class="absolute font-semibold whitespace-nowrap"
                             [style.left.%]="a.x"
                             [style.bottom.%]="a.y"
                             [style.color]="a.color"
                             [style.fontSize.px]="a.size * previewScale()">{{ a.text }}</div>
                      }
                    }
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
export class PdfEdit {
  private renderer = inject(PdfRenderService);

  protected file = signal<File | null>(null);
  protected pages = signal(0);
  protected annos = signal<Anno[]>([]);
  protected busy = signal(false);
  protected error = signal('');
  protected previewUrl = signal<string | null>(null);
  protected previewPage = signal(1);
  protected previewWidth = signal(595);
  protected previewScale = computed(() => 0.5);
  protected version = signal(0);
  protected pageAnnos = computed(() => {
    this.version();
    return this.annos().filter(a => +a.page === this.previewPage());
  });
  private bytes: ArrayBuffer | null = null;

  pageList() { return Array.from({ length: this.pages() }, (_, i) => i + 1); }
  touch() { this.version.update(v => v + 1); }

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
    this.pages.set(doc.getPageCount());
    this.previewPage.set(1);
    this.renderPreview();
  }

  async renderPreview() {
    if (!this.bytes) return;
    try {
      const doc = await this.renderer.loadDoc(this.bytes);
      const r = await this.renderer.renderPageToDataUrl(doc, this.previewPage(), 1);
      this.previewUrl.set(r.dataUrl);
      this.previewWidth.set(r.width);
    } catch (e: any) {
      this.error.set('Preview failed: ' + (e?.message ?? 'unknown error'));
    }
  }

  reset() { this.file.set(null); this.bytes = null; this.annos.set([]); this.previewUrl.set(null); }

  addText() { this.annos.update(a => [...a, { type: 'text', page: this.previewPage(), x: 10, y: 50, w: 0, h: 0, text: 'New text', size: 14, color: '#000000' }]); this.touch(); }
  addRect() { this.annos.update(a => [...a, { type: 'rect', page: this.previewPage(), x: 10, y: 50, w: 20, h: 5, text: '', size: 0, color: '#ffeb3b' }]); this.touch(); }
  remove(i: number) { this.annos.update(a => a.filter((_, idx) => idx !== i)); this.touch(); }

  async run() {
    if (!this.bytes) return;
    this.busy.set(true); this.error.set('');
    try {
      const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const font = await doc.embedFont(StandardFonts.Helvetica);
      this.annos().forEach(a => {
        const idx = (+a.page) - 1;
        if (idx < 0 || idx >= doc.getPageCount()) return;
        const page = doc.getPage(idx);
        const { width, height } = page.getSize();
        const c = this.hex(a.color);
        const x = width * (+a.x) / 100;
        const y = height * (+a.y) / 100;
        if (a.type === 'text') {
          page.drawText(a.text, { x, y, size: +a.size, font, color: rgb(c.r, c.g, c.b) });
        } else {
          page.drawRectangle({ x, y, width: width * (+a.w) / 100, height: height * (+a.h) / 100, color: rgb(c.r, c.g, c.b), opacity: 0.6 });
        }
      });
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-edited.pdf');
    } catch (e: any) { this.error.set(e?.message ?? 'Failed'); }
    finally { this.busy.set(false); }
  }

  private hex(h: string) {
    const v = h.replace('#', '');
    return { r: parseInt(v.slice(0, 2), 16) / 255, g: parseInt(v.slice(2, 4), 16) / 255, b: parseInt(v.slice(4, 6), 16) / 255 };
  }
}
