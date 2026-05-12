import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { SectionHeader } from '../../shared/section-header/section-header';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { ToastService } from '../../shared/toast.service';

interface Swatch { hex: string; rgb: [number, number, number]; pct: number; name: string; }

@Component({
  selector: 'app-image-palette',
  imports: [FormsModule, DecimalPipe, SectionHeader, Dropzone],
  template: `
    <app-section-header title="Color Palette Extractor" subtitle="Drop an image — get its dominant palette as hex, RGB, and CSS variables." icon="🎨" color="from-fuchsia-500 to-pink-600" back="/" backLabel="Home" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">

      @if (!src()) {
        <app-dropzone accept="image/*" hint="Drop an image" (files)="load($event)"></app-dropzone>
      }

      @if (src()) {
        <div class="card p-4 flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <label class="text-xs">Colors</label>
            <input type="range" min="3" max="12" [(ngModel)]="count" (ngModelChange)="extract()" />
            <span class="text-xs font-bold w-6">{{ count }}</span>
          </div>
          <button class="btn-secondary text-xs" (click)="reset()">Load different image</button>
          <span class="flex-1"></span>
          @if (busy()) { <span class="text-xs text-slate-500">Extracting…</span> }
        </div>

        <div class="grid lg:grid-cols-5 gap-4">
          <div class="card p-3 lg:col-span-2 flex items-center justify-center bg-slate-100 dark:bg-slate-900/50">
            <img [src]="src()" class="max-h-[420px] w-auto rounded-lg" />
          </div>

          <div class="lg:col-span-3 space-y-3">
            <div class="card p-4">
              <div class="flex h-16 rounded-lg overflow-hidden">
                @for (s of palette(); track s.hex) {
                  <div [style.background-color]="s.hex" [style.flex]="s.pct" class="cursor-pointer hover:opacity-80 transition" (click)="copy(s.hex)" [title]="s.hex + ' · ' + (s.pct * 100 | number:'1.0-1') + '%'"></div>
                }
              </div>
            </div>

            <div class="space-y-2">
              @for (s of palette(); track s.hex) {
                <div class="card p-3 flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg shrink-0 ring-1 ring-slate-200 dark:ring-slate-700" [style.background-color]="s.hex"></div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-mono text-sm font-bold">{{ s.hex }}</span>
                      <span class="text-xs text-slate-500">{{ s.name }}</span>
                    </div>
                    <div class="text-xs text-slate-500 font-mono">rgb({{ s.rgb[0] }}, {{ s.rgb[1] }}, {{ s.rgb[2] }}) · {{ (s.pct * 100) | number:'1.0-1' }}%</div>
                  </div>
                  <button class="btn-ghost text-xs" (click)="copy(s.hex)">Copy</button>
                </div>
              }
            </div>

            @if (palette().length) {
              <div class="card p-4">
                <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">CSS variables</div>
                <pre class="text-xs font-mono whitespace-pre-wrap break-all">{{ cssVars() }}</pre>
                <button class="btn-secondary text-xs mt-2" (click)="copy(cssVars())">Copy CSS</button>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class ImagePalette {
  protected src = signal<string>('');
  protected count = 6;
  protected palette = signal<Swatch[]>([]);
  protected busy = signal(false);

  constructor(private toast: ToastService) {}

  async load(files: File[]) {
    const f = files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { this.src.set(reader.result as string); this.extract(); };
    reader.readAsDataURL(f);
  }

  reset() { this.src.set(''); this.palette.set([]); }

  async extract() {
    if (!this.src()) return;
    this.busy.set(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = this.src();
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(); });

      const max = 160;
      const ratio = Math.min(max / img.naturalWidth, max / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      const points: [number, number, number][] = [];
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 200) continue;
        points.push([data[i], data[i + 1], data[i + 2]]);
      }
      if (!points.length) { this.palette.set([]); return; }

      const swatches = this.kmeans(points, +this.count);
      this.palette.set(swatches);
    } finally {
      this.busy.set(false);
    }
  }

  private kmeans(points: [number, number, number][], k: number): Swatch[] {
    const centers: [number, number, number][] = [];
    const step = Math.max(1, Math.floor(points.length / k));
    for (let i = 0; i < k; i++) centers.push([...points[Math.min(points.length - 1, i * step)]]);

    const assign = new Array<number>(points.length).fill(0);
    for (let iter = 0; iter < 12; iter++) {
      for (let p = 0; p < points.length; p++) {
        let best = 0, bestD = Infinity;
        for (let c = 0; c < k; c++) {
          const dr = points[p][0] - centers[c][0];
          const dg = points[p][1] - centers[c][1];
          const db = points[p][2] - centers[c][2];
          const d = dr * dr + dg * dg + db * db;
          if (d < bestD) { bestD = d; best = c; }
        }
        assign[p] = best;
      }
      const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
      for (let p = 0; p < points.length; p++) {
        const c = assign[p];
        sums[c][0] += points[p][0]; sums[c][1] += points[p][1]; sums[c][2] += points[p][2]; sums[c][3]++;
      }
      for (let c = 0; c < k; c++) {
        if (!sums[c][3]) continue;
        centers[c] = [Math.round(sums[c][0] / sums[c][3]), Math.round(sums[c][1] / sums[c][3]), Math.round(sums[c][2] / sums[c][3])];
      }
    }
    const counts = new Array<number>(k).fill(0);
    for (const a of assign) counts[a]++;
    const total = points.length;
    return centers
      .map((rgb, i) => ({ rgb, hex: this.toHex(rgb), pct: counts[i] / total, name: this.nameOf(rgb) }))
      .filter(s => s.pct > 0)
      .sort((a, b) => b.pct - a.pct);
  }

  private toHex([r, g, b]: [number, number, number]): string {
    return '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  private nameOf([r, g, b]: [number, number, number]): string {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max - min < 12) return l > 220 ? 'White' : l < 30 ? 'Black' : l < 90 ? 'Dark gray' : l < 170 ? 'Gray' : 'Light gray';
    let hue = 0;
    if (max === r) hue = (60 * ((g - b) / (max - min)) + 360) % 360;
    else if (max === g) hue = 60 * ((b - r) / (max - min)) + 120;
    else hue = 60 * ((r - g) / (max - min)) + 240;
    const names: [number, string][] = [[15, 'Red'], [45, 'Orange'], [70, 'Yellow'], [150, 'Green'], [200, 'Cyan'], [250, 'Blue'], [290, 'Violet'], [330, 'Magenta'], [360, 'Red']];
    return names.find(([h]) => hue <= h)?.[1] ?? 'Color';
  }

  cssVars(): string {
    return ':root {\n' + this.palette().map((s, i) => `  --color-${i + 1}: ${s.hex};`).join('\n') + '\n}';
  }

  async copy(text: string) {
    try { await navigator.clipboard.writeText(text); this.toast.success('Copied ' + (text.length < 12 ? text : 'palette')); } catch {}
  }
}
