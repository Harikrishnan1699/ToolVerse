import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-json',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="JSON Formatter" subtitle="Beautify, minify and validate any JSON in real-time." icon="{}" color="from-emerald-500 to-teal-600" back="/dev" backLabel="All developer tools" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input</div>
            <div class="flex gap-1">
              <button class="btn-ghost text-xs px-2 py-1" (click)="paste()">Paste</button>
              <button class="btn-ghost text-xs px-2 py-1" (click)="clear()">Clear</button>
            </div>
          </div>
          <textarea class="input font-mono text-xs h-[480px]" [(ngModel)]="input" (ngModelChange)="run()" placeholder='{"hello": "world"}'></textarea>
        </div>
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output</div>
            <div class="flex gap-1">
              <select class="input !w-auto !py-1 !px-2 text-xs" [(ngModel)]="indent" (ngModelChange)="run()">
                <option [ngValue]="2">2 spaces</option>
                <option [ngValue]="4">4 spaces</option>
                <option [ngValue]="0">Minify</option>
              </select>
              <button class="btn-ghost text-xs px-2 py-1" (click)="copy()">Copy</button>
            </div>
          </div>
          <textarea class="input font-mono text-xs h-[480px] !bg-slate-50 dark:!bg-slate-800/40" readonly [value]="output()"></textarea>
        </div>
      </div>
      @if (error()) {
        <div class="mt-4 card border-rose-200 dark:border-rose-900/60 p-4 text-sm text-rose-600">⚠ {{ error() }}</div>
      } @else if (input) {
        <div class="mt-4 text-sm text-emerald-600">✓ Valid JSON · {{ stats() }}</div>
      }
    </section>
  `,
})
export class DevJson {
  protected input = '';
  protected indent = 2;
  protected output = signal('');
  protected error = signal('');
  protected stats = signal('');

  run() {
    if (!this.input.trim()) { this.output.set(''); this.error.set(''); this.stats.set(''); return; }
    try {
      const parsed = JSON.parse(this.input);
      this.output.set(this.indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, this.indent));
      this.error.set('');
      const json = JSON.stringify(parsed);
      this.stats.set(`${json.length.toLocaleString()} chars · ${this.deepCount(parsed)} keys`);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Invalid JSON');
      this.output.set('');
    }
  }

  private deepCount(o: any): number {
    if (Array.isArray(o)) return o.reduce((s, x) => s + this.deepCount(x), 0);
    if (o && typeof o === 'object') return Object.keys(o).length + Object.values(o).reduce((s: number, x) => s + this.deepCount(x), 0);
    return 0;
  }

  async paste() { try { this.input = await navigator.clipboard.readText(); this.run(); } catch {} }
  async copy() { try { await navigator.clipboard.writeText(this.output()); } catch {} }
  clear() { this.input = ''; this.run(); }
}
