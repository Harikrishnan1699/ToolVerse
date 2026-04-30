import { Component, signal } from '@angular/core';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-image-color-picker',
  imports: [Dropzone, SectionHeader],
  template: `
    <app-section-header title="Image Color Picker" subtitle="Pick colors and extract a palette from any image." icon="🎨" color="from-rose-500 to-pink-600" back="/image" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) { <app-dropzone title="Drop an image" accept="image/*" (files)="pick($event)" /> }
      @else {
        <div class="grid lg:grid-cols-[1fr_280px] gap-5">
          <div class="card p-4">
            <canvas #cv class="w-full rounded-xl border border-slate-200 dark:border-slate-700 cursor-crosshair" (click)="onClick($event)" (mousemove)="onHover($event)"></canvas>
          </div>
          <div class="card p-4 space-y-4">
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase">Hover</div>
              <div class="mt-2 flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700" [style.background]="hover()"></div>
                <div class="font-mono text-sm">{{ hover() }}</div>
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase">Picked</div>
              @if (!picked().length) { <div class="text-xs text-slate-400 mt-2">Click image to pick a color</div> }
              <div class="mt-2 grid grid-cols-4 gap-2">
                @for (c of picked(); track $index) {
                  <div class="text-center">
                    <div class="w-full aspect-square rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" [style.background]="c" (click)="copy(c)" [title]="c"></div>
                    <div class="font-mono text-xs mt-1">{{ c }}</div>
                  </div>
                }
              </div>
            </div>
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase">Auto palette</div>
              <div class="mt-2 grid grid-cols-5 gap-2">
                @for (c of palette(); track c) {
                  <div class="text-center">
                    <div class="w-full aspect-square rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer" [style.background]="c" (click)="copy(c)" [title]="c"></div>
                    <div class="font-mono text-[10px] mt-1">{{ c }}</div>
                  </div>
                }
              </div>
            </div>
            <button class="btn-secondary w-full" (click)="reset()">Change</button>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`canvas { max-height: 70vh; object-fit: contain; }`],
})
export class ImageColorPicker {
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected hover = signal('#000000');
  protected picked = signal<string[]>([]);
  protected palette = signal<string[]>([]);

  async pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f); this.url.set(URL.createObjectURL(f));
    setTimeout(() => this.render(), 0);
  }
  reset() { if (this.url()) URL.revokeObjectURL(this.url()); this.file.set(null); this.picked.set([]); }

  async render() {
    const c = document.querySelector('canvas') as HTMLCanvasElement;
    const img = new Image(); img.src = this.url();
    await new Promise(r => img.onload = r);
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d')!.drawImage(img, 0, 0);
    this.computePalette();
  }

  private getPx(e: MouseEvent): string {
    const c = e.target as HTMLCanvasElement;
    const r = c.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * c.width;
    const y = ((e.clientY - r.top) / r.height) * c.height;
    const d = c.getContext('2d')!.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    return '#' + [d[0], d[1], d[2]].map(n => n.toString(16).padStart(2, '0')).join('');
  }

  onHover(e: MouseEvent) { this.hover.set(this.getPx(e)); }
  onClick(e: MouseEvent) { this.picked.update(p => [this.getPx(e), ...p].slice(0, 8)); }
  async copy(s: string) { try { await navigator.clipboard.writeText(s); } catch {} }

  private computePalette() {
    const c = document.querySelector('canvas') as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    const w = 100, h = Math.round((c.height / c.width) * 100);
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    tmp.getContext('2d')!.drawImage(c, 0, 0, w, h);
    const data = tmp.getContext('2d')!.getImageData(0, 0, w, h).data;
    const buckets: Record<string, number> = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] >> 5, g = data[i + 1] >> 5, b = data[i + 2] >> 5;
      const k = `${r}-${g}-${b}`;
      buckets[k] = (buckets[k] ?? 0) + 1;
    }
    const top = Object.entries(buckets).sort((a, b) => b[1] - a[1]).slice(0, 10);
    this.palette.set(top.map(([k]) => {
      const [r, g, b] = k.split('-').map(Number);
      return '#' + [(r << 5) + 16, (g << 5) + 16, (b << 5) + 16].map(n => Math.min(255, n).toString(16).padStart(2, '0')).join('');
    }));
  }
}
