import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-regex',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Regex Tester" subtitle="Test JavaScript regular expressions against your text in real-time." icon=".*" color="from-pink-500 to-rose-600" back="/dev" backLabel="All developer tools" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">
      <div class="card p-4">
        <div class="flex items-center gap-2">
          <span class="text-pink-500 font-mono text-lg">/</span>
          <input class="input font-mono text-sm" [(ngModel)]="pattern" (ngModelChange)="run()" placeholder="\\\\w+@\\\\w+\\\\.\\\\w+" />
          <span class="text-pink-500 font-mono text-lg">/</span>
          <input class="input font-mono text-sm !w-24" [(ngModel)]="flags" (ngModelChange)="run()" placeholder="gim" />
        </div>
        @if (error()) { <div class="text-xs text-rose-600 mt-2">{{ error() }}</div> }
        @else if (matches().length) { <div class="text-xs text-emerald-600 mt-2">{{ matches().length }} match(es)</div> }
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-4">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test string</label>
          <textarea class="input mt-1 font-mono text-xs h-72" [(ngModel)]="text" (ngModelChange)="run()"></textarea>
        </div>
        <div class="card p-4">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Highlighted</label>
          <div class="mt-1 font-mono text-xs h-72 overflow-auto whitespace-pre-wrap bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3" [innerHTML]="highlighted()"></div>
        </div>
      </div>

      @if (matches().length) {
        <div class="card p-4">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Matches</div>
          <div class="space-y-1 text-xs font-mono max-h-72 overflow-auto">
            @for (m of matches(); track $index; let i = $index) {
              <div class="p-2 rounded bg-slate-50 dark:bg-slate-800/40">
                <span class="text-slate-500">#{{ i + 1 }}</span> · <span class="text-pink-500">{{ m.text }}</span>
                <span class="text-slate-400"> at index {{ m.index }}</span>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class DevRegex {
  protected pattern = '';
  protected flags = 'g';
  protected text = '';
  protected matches = signal<{text: string; index: number}[]>([]);
  protected highlighted = signal('');
  protected error = signal('');

  run() {
    this.error.set(''); this.matches.set([]); this.highlighted.set(this.escape(this.text));
    if (!this.pattern || !this.text) return;
    try {
      const re = new RegExp(this.pattern, this.flags);
      const ms: {text: string; index: number}[] = [];
      let html = '';
      if (this.flags.includes('g')) {
        let last = 0; let m: RegExpExecArray | null;
        while ((m = re.exec(this.text))) {
          ms.push({ text: m[0], index: m.index });
          html += this.escape(this.text.slice(last, m.index)) + '<mark class="bg-yellow-200 dark:bg-yellow-700/50 rounded px-0.5">' + this.escape(m[0]) + '</mark>';
          last = m.index + m[0].length;
          if (m[0].length === 0) re.lastIndex++;
        }
        html += this.escape(this.text.slice(last));
      } else {
        const m = re.exec(this.text);
        if (m) {
          ms.push({ text: m[0], index: m.index });
          html = this.escape(this.text.slice(0, m.index)) + '<mark class="bg-yellow-200 dark:bg-yellow-700/50 rounded px-0.5">' + this.escape(m[0]) + '</mark>' + this.escape(this.text.slice(m.index + m[0].length));
        } else html = this.escape(this.text);
      }
      this.matches.set(ms);
      this.highlighted.set(html);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Invalid regex');
    }
  }

  private escape(s: string) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
