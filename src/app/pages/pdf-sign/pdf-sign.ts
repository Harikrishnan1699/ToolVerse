import { Component, ElementRef, ViewChild, AfterViewInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';
import { PdfRenderService } from '../../shared/pdf-render.service';

type SigPos = 'tl' | 'tr' | 'bl' | 'br' | 'bc';

@Component({
  selector: 'app-pdf-sign',
  imports: [Dropzone, FormsModule, PageHeader],
  template: `
    <app-page-header title="Sign PDF" subtitle="Draw your signature and stamp it onto a PDF page." icon="✍" color="from-pink-500 to-rose-600" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (!file()) {
        <app-dropzone title="Drop a PDF" (files)="pick($event)" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-6" data-no-drop>
          <div class="card p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 grid place-items-center text-white">✍</div>
              <div class="flex-1 min-w-0"><div class="font-semibold truncate">{{ file()!.name }}</div><div class="text-xs text-slate-500">{{ pages() }} pages</div></div>
              <button class="btn-secondary" (click)="reset()">Change</button>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium">Draw your signature</label>
                <button class="btn-ghost px-2 py-1 text-xs" (click)="clearSig()">Clear</button>
              </div>
              <canvas #pad class="w-full h-44 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white touch-none cursor-crosshair"></canvas>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">Page</label>
                <select class="input mt-1" [ngModel]="page()" (ngModelChange)="page.set(+$event); renderPreview()">
                  @for (n of pageList(); track n) { <option [ngValue]="n">Page {{ n }}</option> }
                </select>
              </div>
              <div>
                <label class="text-sm font-medium">Position</label>
                <select class="input mt-1" [ngModel]="pos()" (ngModelChange)="pos.set($event)">
                  <option value="bl">Bottom-left</option>
                  <option value="br">Bottom-right</option>
                  <option value="tl">Top-left</option>
                  <option value="tr">Top-right</option>
                  <option value="bc">Bottom-center</option>
                </select>
              </div>
            </div>

            <button class="btn-primary w-full" (click)="run()" [disabled]="busy()">
              @if (busy()) { Stamping… } @else { Sign & download }
            </button>
            @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
          </div>

          <div class="card p-6">
            <div class="text-sm font-semibold mb-3">Live preview (page {{ page() }})</div>
            <div class="relative rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden grid place-items-center" style="min-height: 420px;">
              @if (previewUrl()) {
                <div class="relative inline-block">
                  <img [src]="previewUrl()!" class="block max-h-[600px] w-auto" alt="Preview" />
                  @if (sigPreview()) {
                    <img [src]="sigPreview()!" class="absolute"
                         [style.top]="overlayStyle().top"
                         [style.bottom]="overlayStyle().bottom"
                         [style.left]="overlayStyle().left"
                         [style.right]="overlayStyle().right"
                         [style.transform]="overlayStyle().transform"
                         [style.width.%]="25" alt="Signature" />
                  } @else {
                    <div class="absolute border-2 border-dashed border-rose-500/80 rounded grid place-items-center text-xs text-rose-600 bg-white/80"
                         [style.top]="overlayStyle().top"
                         [style.bottom]="overlayStyle().bottom"
                         [style.left]="overlayStyle().left"
                         [style.right]="overlayStyle().right"
                         [style.transform]="overlayStyle().transform"
                         [style.width.%]="25"
                         [style.height.px]="48">
                      Signature here
                    </div>
                  }
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
export class PdfSign implements AfterViewInit {
  @ViewChild('pad') padRef?: ElementRef<HTMLCanvasElement>;
  private renderer = inject(PdfRenderService);

  protected file = signal<File | null>(null);
  protected pages = signal(0);
  protected page = signal(1);
  protected pos = signal<SigPos>('br');
  protected busy = signal(false);
  protected error = signal('');
  protected previewUrl = signal<string | null>(null);
  protected sigPreview = signal<string | null>(null);
  protected overlayStyle = computed(() => {
    const m = '4%';
    switch (this.pos()) {
      case 'bl': return { top: 'auto', left: m, right: 'auto', bottom: m, transform: 'none' };
      case 'br': return { top: 'auto', left: 'auto', right: m, bottom: m, transform: 'none' };
      case 'tl': return { top: m, left: m, right: 'auto', bottom: 'auto', transform: 'none' };
      case 'tr': return { top: m, left: 'auto', right: m, bottom: 'auto', transform: 'none' };
      case 'bc': return { top: 'auto', left: '50%', right: 'auto', bottom: m, transform: 'translateX(-50%)' };
    }
  });
  private bytes: ArrayBuffer | null = null;
  private drawing = false;
  private pad?: HTMLCanvasElement;

  pageList() { return Array.from({ length: this.pages() }, (_, i) => i + 1); }

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
    this.pages.set(doc.getPageCount());
    this.page.set(1);
    this.renderPreview();
    setTimeout(() => this.setupPad(), 0);
  }

  async renderPreview() {
    if (!this.bytes) return;
    try {
      const doc = await this.renderer.loadDoc(this.bytes);
      const r = await this.renderer.renderPageToDataUrl(doc, this.page(), 1);
      this.previewUrl.set(r.dataUrl);
    } catch (e: any) {
      this.error.set('Preview failed: ' + (e?.message ?? 'unknown error'));
    }
  }

  reset() { this.file.set(null); this.bytes = null; this.previewUrl.set(null); this.sigPreview.set(null); }

  ngAfterViewInit() { /* setup happens after pick() */ }

  private setupPad() {
    const c = this.padRef?.nativeElement; if (!c) return;
    this.pad = c;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 2.2; ctx.strokeStyle = '#0f172a';

    const updatePreview = () => {
      const data = c.toDataURL('image/png');
      this.sigPreview.set(this.isCanvasBlank(c) ? null : data);
    };

    const start = (e: PointerEvent) => {
      this.drawing = true;
      const r = c.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
      c.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!this.drawing) return;
      const r = c.getBoundingClientRect();
      ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
      ctx.stroke();
    };
    const end = () => { if (this.drawing) { this.drawing = false; updatePreview(); } };

    c.addEventListener('pointerdown', start);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', end);
  }

  private isCanvasBlank(c: HTMLCanvasElement): boolean {
    const ctx = c.getContext('2d')!;
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) return false;
    return true;
  }

  clearSig() {
    if (!this.pad) return;
    const ctx = this.pad.getContext('2d')!;
    ctx.clearRect(0, 0, this.pad.width, this.pad.height);
    this.sigPreview.set(null);
  }

  async run() {
    if (!this.bytes || !this.pad) return;
    this.busy.set(true); this.error.set('');
    try {
      const sigPng = await this.padToTrimmedPng(this.pad);
      if (!sigPng) throw new Error('Please draw a signature first.');

      const doc = await PDFDocument.load(this.bytes, { ignoreEncryption: true });
      const png = await doc.embedPng(sigPng);
      const targetW = 150;
      const ratio = png.width / png.height;
      const w = targetW, h = targetW / ratio;
      const page = doc.getPage(this.page() - 1);
      const { width, height } = page.getSize();
      const m = 32;
      let x = width - w - m, y = m;
      switch (this.pos()) {
        case 'bl': x = m; y = m; break;
        case 'br': x = width - w - m; y = m; break;
        case 'tl': x = m; y = height - h - m; break;
        case 'tr': x = width - w - m; y = height - h - m; break;
        case 'bc': x = (width - w) / 2; y = m; break;
      }
      page.drawImage(png, { x, y, width: w, height: h });
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-signed.pdf');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed');
    } finally {
      this.busy.set(false);
    }
  }

  private async padToTrimmedPng(c: HTMLCanvasElement): Promise<ArrayBuffer | null> {
    const ctx = c.getContext('2d')!;
    const data = ctx.getImageData(0, 0, c.width, c.height);
    let minX = c.width, minY = c.height, maxX = 0, maxY = 0, found = false;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const a = data.data[(y * c.width + x) * 4 + 3];
        if (a > 0) {
          found = true;
          if (x < minX) minX = x; if (y < minY) minY = y;
          if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        }
      }
    }
    if (!found) return null;
    const pad = 8;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(c.width - 1, maxX + pad); maxY = Math.min(c.height - 1, maxY + pad);
    const w = maxX - minX, h = maxY - minY;
    const trim = document.createElement('canvas');
    trim.width = w; trim.height = h;
    trim.getContext('2d')!.drawImage(c, minX, minY, w, h, 0, 0, w, h);
    const blob: Blob = await new Promise(res => trim.toBlob(b => res(b!), 'image/png'));
    return await blob.arrayBuffer();
  }
}
