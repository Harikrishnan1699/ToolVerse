import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-shadow',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Box-Shadow Generator" subtitle="Visually craft a CSS box-shadow with full control." icon="▣" color="from-slate-500 to-slate-700" back="/dev" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-[1fr_360px] gap-5">
      <div class="card p-4 grid place-items-center min-h-96">
        <div class="w-48 h-48 rounded-2xl bg-white dark:bg-slate-200" [style.box-shadow]="shadow()"></div>
      </div>
      <div class="card p-4 space-y-4">
        <div><label class="text-sm font-medium">X offset: {{ x }}px</label><input type="range" min="-100" max="100" class="w-full" [(ngModel)]="x" /></div>
        <div><label class="text-sm font-medium">Y offset: {{ y }}px</label><input type="range" min="-100" max="100" class="w-full" [(ngModel)]="y" /></div>
        <div><label class="text-sm font-medium">Blur: {{ blur }}px</label><input type="range" min="0" max="200" class="w-full" [(ngModel)]="blur" /></div>
        <div><label class="text-sm font-medium">Spread: {{ spread }}px</label><input type="range" min="-50" max="50" class="w-full" [(ngModel)]="spread" /></div>
        <div class="grid grid-cols-2 gap-2 items-end">
          <div><label class="text-sm font-medium">Color</label><input type="color" class="mt-1 h-10 w-full rounded-lg" [(ngModel)]="color" /></div>
          <div><label class="text-sm font-medium">Alpha: {{ alpha }}%</label><input type="range" min="0" max="100" class="w-full" [(ngModel)]="alpha" /></div>
        </div>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="inset" /> Inset</label>
        <div class="font-mono text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 break-all">box-shadow: {{ shadow() }};</div>
        <button class="btn-secondary text-xs w-full" (click)="copy()">Copy CSS</button>
      </div>
    </section>
  `,
})
export class DevShadow {
  protected x = 0; protected y = 14; protected blur = 40; protected spread = -10;
  protected color = '#000000'; protected alpha = 25; protected inset = false;
  protected shadow = computed(() => {
    const v = this.color.replace('#', '');
    const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
    return `${this.inset ? 'inset ' : ''}${this.x}px ${this.y}px ${this.blur}px ${this.spread}px rgba(${r}, ${g}, ${b}, ${(+this.alpha / 100).toFixed(2)})`;
  });
  async copy() { try { await navigator.clipboard.writeText(this.shadow()); } catch {} }
}
