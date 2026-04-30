import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-uuid',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="UUID Generator" subtitle="Generate cryptographically-random UUID v4 / GUID values." icon="ID" color="from-amber-500 to-orange-600" back="/dev" backLabel="All developer tools" />
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="card p-6 space-y-5">
        <div class="grid grid-cols-2 gap-3 items-end">
          <div>
            <label class="text-sm font-medium">Quantity</label>
            <input type="number" min="1" max="500" class="input mt-1" [(ngModel)]="count" />
          </div>
          <div>
            <label class="text-sm font-medium">Format</label>
            <select class="input mt-1" [(ngModel)]="format">
              <option value="lower">Lowercase</option>
              <option value="upper">Uppercase</option>
              <option value="braces">{{ '{Braces}' }}</option>
              <option value="nodash">No dashes</option>
            </select>
          </div>
        </div>
        <button class="btn-primary" (click)="gen()">Generate</button>
        @if (uuids().length) {
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Result</div>
              <button class="btn-ghost text-xs px-2 py-1" (click)="copyAll()">Copy all</button>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 font-mono text-xs max-h-96 overflow-auto">
              @for (u of uuids(); track u) { <div class="py-0.5">{{ u }}</div> }
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class DevUuid {
  protected count = 5;
  protected format = 'lower';
  protected uuids = signal<string[]>([]);

  gen() {
    const out: string[] = [];
    for (let i = 0; i < +this.count; i++) out.push(this.fmt(crypto.randomUUID()));
    this.uuids.set(out);
  }

  private fmt(u: string) {
    if (this.format === 'upper') return u.toUpperCase();
    if (this.format === 'braces') return '{' + u + '}';
    if (this.format === 'nodash') return u.replace(/-/g, '');
    return u;
  }

  async copyAll() { try { await navigator.clipboard.writeText(this.uuids().join('\n')); } catch {} }
}
