import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-image-watermark',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Image Watermark" subtitle="Stamp text on photos with custom font, color and position." icon="W" color="from-pink-500 to-fuchsia-600" back="/image" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) { <app-dropzone title="Drop an image" accept="image/*" (files)="pick($event)" /> }
      @else {
        <div class="grid lg:grid-cols-[1fr_300px] gap-5">
          <div class="card p-4">
            <canvas #cv class="w-full rounded-xl border border-slate-200 dark:border-slate-700" #canvas></canvas>
          </div>
          <div class="card p-4 space-y-3">
            <div><label class="text-sm font-medium">Text</label><input class="input mt-1" [(ngModel)]="text" (ngModelChange)="render()" /></div>
            <div><label class="text-sm font-medium">Size</label><input type="number" min="10" max="300" class="input mt-1" [(ngModel)]="size" (ngModelChange)="render()" /></div>
            <div><label class="text-sm font-medium">Color</label><input type="color" class="mt-1 h-10 w-full rounded-lg" [(ngModel)]="color" (ngModelChange)="render()" /></div>
            <div><label class="text-sm font-medium">Opacity: {{ opacity }}%</label><input type="range" min="10" max="100" class="w-full" [(ngModel)]="opacity" (ngModelChange)="render()" /></div>
            <div>
              <label class="text-sm font-medium">Position</label>
              <select class="input mt-1" [(ngModel)]="pos" (ngModelChange)="render()">
                <option value="tl">Top-left</option><option value="tc">Top-center</option><option value="tr">Top-right</option>
                <option value="ml">Middle-left</option><option value="mc">Middle-center</option><option value="mr">Middle-right</option>
                <option value="bl">Bottom-left</option><option value="bc">Bottom-center</option><option value="br">Bottom-right</option>
              </select>
            </div>
            <button class="btn-primary w-full" (click)="download()">Download</button>
            <button class="btn-secondary w-full" (click)="reset()">Change image</button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`canvas { max-height: 70vh; object-fit: contain; }`],
})
export class ImageWatermark {
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected text = '© Toolverse';
  protected size = 48; protected color = '#ffffff'; protected opacity = 80;
  protected pos = 'br';

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f); this.url.set(URL.createObjectURL(f));
    setTimeout(() => this.render(), 0);
  }
  reset() { if (this.url()) URL.revokeObjectURL(this.url()); this.file.set(null); }

  async render() {
    if (!this.url()) return;
    const c = document.querySelector('canvas') as HTMLCanvasElement; if (!c) return;
    const img = new Image(); img.src = this.url();
    await new Promise(r => img.onload = r);
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    ctx.font = `bold ${this.size}px Inter, Arial`;
    ctx.fillStyle = this.color; ctx.globalAlpha = this.opacity / 100;
    const m = ctx.measureText(this.text);
    const pad = 24;
    let x = pad, y = +this.size + pad;
    const W = c.width, H = c.height;
    switch (this.pos) {
      case 'tl': x = pad; y = +this.size + pad; break;
      case 'tc': x = (W - m.width) / 2; y = +this.size + pad; break;
      case 'tr': x = W - m.width - pad; y = +this.size + pad; break;
      case 'ml': x = pad; y = H / 2; break;
      case 'mc': x = (W - m.width) / 2; y = H / 2; break;
      case 'mr': x = W - m.width - pad; y = H / 2; break;
      case 'bl': x = pad; y = H - pad; break;
      case 'bc': x = (W - m.width) / 2; y = H - pad; break;
      case 'br': x = W - m.width - pad; y = H - pad; break;
    }
    ctx.fillText(this.text, x, y);
  }

  async download() {
    const c = document.querySelector('canvas') as HTMLCanvasElement; if (!c) return;
    const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/png'));
    saveAs(blob, (this.file()?.name ?? 'image').replace(/\.[^.]+$/, '') + '-wm.png');
  }
}
