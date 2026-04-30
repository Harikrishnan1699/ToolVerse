import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-color',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Color Converter" subtitle="HEX ↔ RGB ↔ HSL with live preview and palette suggestions." icon="●" color="from-fuchsia-500 to-pink-600" back="/dev" backLabel="All developer tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-2 gap-5">
      <div class="card p-6 space-y-4">
        <div class="rounded-2xl h-40 shadow-glow" [style.background]="hex"></div>

        <div class="grid grid-cols-3 gap-2 items-end">
          <div class="col-span-2">
            <label class="text-xs font-semibold text-slate-500 uppercase">HEX</label>
            <input class="input mt-1 font-mono uppercase" [(ngModel)]="hex" (ngModelChange)="fromHex()" />
          </div>
          <input type="color" class="h-11 w-full rounded-xl border border-slate-200 dark:border-slate-700" [value]="hex" (input)="onPicker($event)" />
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div><label class="text-xs font-semibold text-slate-500">R</label><input type="number" min="0" max="255" class="input mt-1" [(ngModel)]="r" (ngModelChange)="fromRgb()" /></div>
          <div><label class="text-xs font-semibold text-slate-500">G</label><input type="number" min="0" max="255" class="input mt-1" [(ngModel)]="g" (ngModelChange)="fromRgb()" /></div>
          <div><label class="text-xs font-semibold text-slate-500">B</label><input type="number" min="0" max="255" class="input mt-1" [(ngModel)]="b" (ngModelChange)="fromRgb()" /></div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div><label class="text-xs font-semibold text-slate-500">H</label><input type="number" min="0" max="360" class="input mt-1" [(ngModel)]="h" (ngModelChange)="fromHsl()" /></div>
          <div><label class="text-xs font-semibold text-slate-500">S %</label><input type="number" min="0" max="100" class="input mt-1" [(ngModel)]="s" (ngModelChange)="fromHsl()" /></div>
          <div><label class="text-xs font-semibold text-slate-500">L %</label><input type="number" min="0" max="100" class="input mt-1" [(ngModel)]="l" (ngModelChange)="fromHsl()" /></div>
        </div>
      </div>

      <div class="card p-6 space-y-4">
        <div>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Code snippets</div>
          @for (c of snippets(); track c.label) {
            <div class="flex items-center gap-2 py-1.5">
              <div class="text-xs font-semibold w-16 text-slate-500">{{ c.label }}</div>
              <div class="font-mono text-xs flex-1 truncate">{{ c.value }}</div>
              <button class="btn-ghost text-xs px-2 py-0.5" (click)="copy(c.value)">Copy</button>
            </div>
          }
        </div>
        <div>
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Variations</div>
          <div class="grid grid-cols-5 gap-2">
            @for (v of variations(); track v) {
              <button class="rounded-lg aspect-square border border-slate-200 dark:border-slate-700" [style.background]="v" (click)="hex = v; fromHex();" [title]="v"></button>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class DevColor {
  protected hex = '#3a5cff';
  protected r = 58; protected g = 92; protected b = 255;
  protected h = 226; protected s = 100; protected l = 61;
  protected snippets = computed(() => [
    { label: 'HEX', value: this.hex },
    { label: 'RGB', value: `rgb(${this.r}, ${this.g}, ${this.b})` },
    { label: 'RGBA', value: `rgba(${this.r}, ${this.g}, ${this.b}, 1)` },
    { label: 'HSL', value: `hsl(${this.h}, ${this.s}%, ${this.l}%)` },
    { label: 'CSS var', value: `--brand: ${this.hex};` },
    { label: 'Tailwind', value: `bg-[${this.hex}]` },
  ]);
  protected variations = computed(() => [10, 25, 40, 55, 70].map(L => this.hslToHex(this.h, this.s, L)));

  fromHex() {
    const v = this.hex.replace('#', '');
    if (!/^[\da-f]{6}$/i.test(v)) return;
    this.r = parseInt(v.slice(0, 2), 16); this.g = parseInt(v.slice(2, 4), 16); this.b = parseInt(v.slice(4, 6), 16);
    this.toHsl();
  }
  fromRgb() {
    this.hex = '#' + [this.r, this.g, this.b].map(n => Math.max(0, Math.min(255, +n)).toString(16).padStart(2, '0')).join('');
    this.toHsl();
  }
  fromHsl() {
    this.hex = this.hslToHex(+this.h, +this.s, +this.l);
    this.fromHex();
  }
  onPicker(e: Event) { this.hex = (e.target as HTMLInputElement).value; this.fromHex(); }

  private toHsl() {
    const r = this.r / 255, g = this.g / 255, b = this.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    this.h = Math.round(h * 360); this.s = Math.round(s * 100); this.l = Math.round(l * 100);
  }

  private hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return '#' + [f(0), f(8), f(4)].map(n => n.toString(16).padStart(2, '0')).join('');
  }

  async copy(s: string) { try { await navigator.clipboard.writeText(s); } catch {} }
}
