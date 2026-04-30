import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

type Tab = 'count' | 'case' | 'lorem' | 'diff' | 'dedup' | 'reverse' | 'find';

@Component({
  selector: 'app-text-tools',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Text Toolkit" subtitle="Counter, case converter, lorem ipsum, diff, dedup, reverse and find/replace — all in one." icon="¶" color="from-indigo-500 to-violet-600" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-2 flex flex-wrap gap-1">
        @for (t of tabs; track t.id) {
          <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === t.id" [class.dark:!bg-brand-950]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
        }
      </div>

      @switch (tab()) {
        @case ('count') {
          <div class="grid lg:grid-cols-[1fr_280px] gap-5">
            <div class="card p-4"><textarea class="input font-mono text-xs h-96" [(ngModel)]="text" placeholder="Paste text here…"></textarea></div>
            <div class="card p-4 space-y-2 text-sm">
              <div class="flex justify-between"><span class="text-slate-500">Characters</span><span class="font-bold">{{ text.length }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Without spaces</span><span class="font-bold">{{ text.replace(/\\s/g, '').length }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Words</span><span class="font-bold">{{ wordCount() }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Sentences</span><span class="font-bold">{{ sentenceCount() }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Lines</span><span class="font-bold">{{ text.split('\\n').length }}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Reading time</span><span class="font-bold">{{ readTime() }}</span></div>
            </div>
          </div>
        }
        @case ('case') {
          <div class="grid lg:grid-cols-2 gap-5">
            <div class="card p-4"><textarea class="input font-mono text-xs h-72" [(ngModel)]="text"></textarea></div>
            <div class="card p-4 space-y-2">
              <button class="btn-secondary w-full text-xs" (click)="apply('UPPER')">UPPERCASE</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('lower')">lowercase</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('Title')">Title Case</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('Sentence')">Sentence case</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('camel')">camelCase</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('Pascal')">PascalCase</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('snake')">snake_case</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('kebab')">kebab-case</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('CONSTANT')">CONSTANT_CASE</button>
              <button class="btn-secondary w-full text-xs" (click)="apply('aLtErNaTe')">aLtErNaTe</button>
            </div>
          </div>
        }
        @case ('lorem') {
          <div class="card p-4 space-y-3">
            <div class="grid grid-cols-3 gap-3">
              <div><label class="text-xs font-medium">Paragraphs</label><input type="number" min="1" max="50" class="input mt-1" [(ngModel)]="paras" /></div>
              <div><label class="text-xs font-medium">Words / paragraph</label><input type="number" min="10" max="200" class="input mt-1" [(ngModel)]="wpp" /></div>
              <div class="self-end"><button class="btn-primary w-full" (click)="genLorem()">Generate</button></div>
            </div>
            <textarea class="input font-mono text-xs h-72" [value]="loremText()" readonly></textarea>
            <button class="btn-secondary text-xs" (click)="copy(loremText())">Copy</button>
          </div>
        }
        @case ('diff') {
          <div class="grid lg:grid-cols-2 gap-5">
            <div class="card p-4"><label class="text-xs font-semibold text-slate-500 uppercase">Original</label><textarea class="input mt-1 font-mono text-xs h-72" [(ngModel)]="diffA" (ngModelChange)="runDiff()"></textarea></div>
            <div class="card p-4"><label class="text-xs font-semibold text-slate-500 uppercase">Modified</label><textarea class="input mt-1 font-mono text-xs h-72" [(ngModel)]="diffB" (ngModelChange)="runDiff()"></textarea></div>
          </div>
          <div class="card p-4">
            <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Diff</div>
            <pre class="font-mono text-xs whitespace-pre-wrap leading-relaxed" [innerHTML]="diffOut()"></pre>
          </div>
        }
        @case ('dedup') {
          <div class="card p-4 space-y-3">
            <textarea class="input font-mono text-xs h-72" [(ngModel)]="text"></textarea>
            <div class="flex flex-wrap gap-2">
              <button class="btn-secondary text-xs" (click)="apply('dedup')">Remove duplicate lines</button>
              <button class="btn-secondary text-xs" (click)="apply('sortAsc')">Sort A → Z</button>
              <button class="btn-secondary text-xs" (click)="apply('sortDesc')">Sort Z → A</button>
              <button class="btn-secondary text-xs" (click)="apply('shuffle')">Shuffle</button>
              <button class="btn-secondary text-xs" (click)="apply('trim')">Trim each line</button>
              <button class="btn-secondary text-xs" (click)="apply('strip')">Remove blank lines</button>
            </div>
          </div>
        }
        @case ('reverse') {
          <div class="card p-4 space-y-3">
            <textarea class="input font-mono text-xs h-72" [(ngModel)]="text"></textarea>
            <div class="flex gap-2">
              <button class="btn-secondary text-xs" (click)="apply('reverseChars')">Reverse characters</button>
              <button class="btn-secondary text-xs" (click)="apply('reverseWords')">Reverse word order</button>
              <button class="btn-secondary text-xs" (click)="apply('reverseLines')">Reverse line order</button>
            </div>
          </div>
        }
        @case ('find') {
          <div class="card p-4 space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <input class="input font-mono text-xs" placeholder="Find" [(ngModel)]="find" />
              <input class="input font-mono text-xs" placeholder="Replace with" [(ngModel)]="replace" />
            </div>
            <label class="flex items-center gap-2 text-xs"><input type="checkbox" [(ngModel)]="findRegex" /> Treat as regex</label>
            <textarea class="input font-mono text-xs h-72" [(ngModel)]="text"></textarea>
            <button class="btn-primary" (click)="apply('replace')">Replace all</button>
          </div>
        }
      }
    </section>
  `,
})
export class TextTools {
  protected tab = signal<Tab>('count');
  protected tabs: { id: Tab; label: string }[] = [
    { id: 'count', label: 'Counter' }, { id: 'case', label: 'Case Converter' },
    { id: 'lorem', label: 'Lorem Ipsum' }, { id: 'diff', label: 'Text Diff' },
    { id: 'dedup', label: 'Sort / Dedup' }, { id: 'reverse', label: 'Reverse' },
    { id: 'find', label: 'Find & Replace' },
  ];
  protected text = '';
  protected paras = 3; protected wpp = 50;
  protected loremText = signal('');
  protected diffA = ''; protected diffB = ''; protected diffOut = signal('');
  protected find = ''; protected replace = ''; protected findRegex = false;

  wordCount() { return this.text.trim().split(/\s+/).filter(Boolean).length; }
  sentenceCount() { return this.text.split(/[.!?]+/).filter(s => s.trim()).length; }
  readTime() { const w = this.wordCount(); const m = Math.ceil(w / 200); return m < 1 ? '< 1 min' : m + ' min'; }

  apply(op: string) {
    let t = this.text;
    switch (op) {
      case 'UPPER': t = t.toUpperCase(); break;
      case 'lower': t = t.toLowerCase(); break;
      case 'Title': t = t.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase()); break;
      case 'Sentence': t = t.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (_, p, c) => p + c.toUpperCase()); break;
      case 'camel': t = t.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase()); break;
      case 'Pascal': t = t.toLowerCase().replace(/(^|[^a-z0-9])(.)/g, (_, p, c) => c.toUpperCase()); break;
      case 'snake': t = t.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); break;
      case 'kebab': t = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); break;
      case 'CONSTANT': t = t.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, ''); break;
      case 'aLtErNaTe': t = [...t].map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join(''); break;
      case 'dedup': t = [...new Set(t.split('\n'))].join('\n'); break;
      case 'sortAsc': t = t.split('\n').sort().join('\n'); break;
      case 'sortDesc': t = t.split('\n').sort().reverse().join('\n'); break;
      case 'shuffle': t = t.split('\n').sort(() => Math.random() - 0.5).join('\n'); break;
      case 'trim': t = t.split('\n').map(l => l.trim()).join('\n'); break;
      case 'strip': t = t.split('\n').filter(l => l.trim()).join('\n'); break;
      case 'reverseChars': t = [...t].reverse().join(''); break;
      case 'reverseWords': t = t.split(/(\s+)/).reverse().join(''); break;
      case 'reverseLines': t = t.split('\n').reverse().join('\n'); break;
      case 'replace':
        try { const re = this.findRegex ? new RegExp(this.find, 'g') : new RegExp(this.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'); t = t.replace(re, this.replace); } catch {}
        break;
    }
    this.text = t;
  }

  genLorem() {
    const W = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do','eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','commodo','consequat','duis','aute','irure','reprehenderit','voluptate','velit','esse','cillum','fugiat','nulla','pariatur'];
    const ps: string[] = [];
    for (let i = 0; i < +this.paras; i++) {
      const words: string[] = [];
      for (let j = 0; j < +this.wpp; j++) words.push(W[Math.floor(Math.random() * W.length)]);
      let s = words.join(' '); s = s[0].toUpperCase() + s.slice(1) + '.';
      ps.push(s);
    }
    this.loremText.set(ps.join('\n\n'));
  }

  runDiff() {
    const a = this.diffA.split('\n'); const b = this.diffB.split('\n');
    const out: string[] = [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      if (a[i] === b[i]) out.push('  ' + this.esc(a[i] ?? ''));
      else { if (a[i] !== undefined) out.push(`<span class="text-rose-500">- ${this.esc(a[i])}</span>`); if (b[i] !== undefined) out.push(`<span class="text-emerald-500">+ ${this.esc(b[i])}</span>`); }
    }
    this.diffOut.set(out.join('\n'));
  }
  private esc(s: string) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  async copy(s: string) { try { await navigator.clipboard.writeText(s); } catch {} }
}
