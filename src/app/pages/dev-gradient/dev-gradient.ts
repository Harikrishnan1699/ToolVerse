import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-gradient',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="CSS Gradient Generator" subtitle="Build linear or radial gradients with live preview and copy-ready CSS." icon="◐" color="from-fuchsia-500 to-purple-600" back="/dev" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-[1fr_360px] gap-5">
      <div class="card p-4">
        <div class="rounded-2xl h-96 shadow-glow" [style.background]="css()"></div>
        <div class="mt-4 font-mono text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 break-all">background: {{ css() }};</div>
        <button class="btn-secondary text-xs mt-2" (click)="copy()">Copy CSS</button>
      </div>
      <div class="card p-4 space-y-4">
        <div>
          <label class="text-sm font-medium">Type</label>
          <div class="flex gap-2 mt-1">
            <button class="btn-secondary text-xs flex-1" [class.!bg-brand-50]="type() === 'linear'" (click)="type.set('linear')">Linear</button>
            <button class="btn-secondary text-xs flex-1" [class.!bg-brand-50]="type() === 'radial'" (click)="type.set('radial')">Radial</button>
          </div>
        </div>
        @if (type() === 'linear') {
          <div>
            <label class="text-sm font-medium">Angle: {{ angle }}°</label>
            <input type="range" min="0" max="360" class="w-full" [(ngModel)]="angle" />
          </div>
        }
        <div class="space-y-2">
          @for (s of stops(); track $index; let i = $index) {
            <div class="flex items-center gap-2">
              <input type="color" class="h-9 w-12 rounded-lg border border-slate-200 dark:border-slate-700" [(ngModel)]="s.color" />
              <input type="number" min="0" max="100" class="input !py-1 !w-20" [(ngModel)]="s.pos" />
              <span class="text-xs text-slate-500">%</span>
              <button class="btn-ghost text-xs ml-auto text-rose-600" (click)="removeStop(i)" [disabled]="stops().length <= 2">×</button>
            </div>
          }
        </div>
        <button class="btn-secondary text-xs w-full" (click)="addStop()">+ Add color stop</button>
      </div>
    </section>
  `,
})
export class DevGradient {
  protected type = signal<'linear' | 'radial'>('linear');
  protected angle = 135;
  protected stops = signal([
    { color: '#3a5cff', pos: 0 },
    { color: '#a855f7', pos: 100 },
  ]);
  protected css = computed(() => {
    const list = [...this.stops()].sort((a, b) => +a.pos - +b.pos).map(s => `${s.color} ${s.pos}%`).join(', ');
    return this.type() === 'linear' ? `linear-gradient(${this.angle}deg, ${list})` : `radial-gradient(circle, ${list})`;
  });

  addStop() { this.stops.update(s => [...s, { color: '#ec4899', pos: 50 }]); }
  removeStop(i: number) { this.stops.update(s => s.filter((_, idx) => idx !== i)); }
  async copy() { try { await navigator.clipboard.writeText(this.css()); } catch {} }
}
