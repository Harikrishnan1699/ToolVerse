import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

type Align = 'left' | 'center' | 'right';

@Component({
  selector: 'app-markdown-table',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Markdown Table Builder" subtitle="Edit cells visually, get clean Markdown. Paste a TSV/CSV to import." icon="▦" color="from-amber-500 to-orange-600" back="/" backLabel="Home" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">

      <div class="card p-4 flex flex-wrap items-center gap-2">
        <button class="btn-secondary text-xs" (click)="addRow()">＋ Row</button>
        <button class="btn-secondary text-xs" (click)="addCol()">＋ Column</button>
        <button class="btn-ghost text-xs" (click)="removeRow()" [disabled]="rows().length <= 1">－ Row</button>
        <button class="btn-ghost text-xs" (click)="removeCol()" [disabled]="cols() <= 1">－ Column</button>
        <span class="mx-2 h-5 w-px bg-slate-200 dark:bg-slate-700"></span>
        <button class="btn-secondary text-xs" (click)="importPrompt()">📥 Paste TSV/CSV</button>
        <button class="btn-ghost text-xs" (click)="clear()">Clear</button>
        <span class="flex-1"></span>
        <span class="text-xs text-slate-500">{{ rows().length }} rows · {{ cols() }} cols</span>
      </div>

      <div class="card p-4 overflow-auto">
        <table class="border-collapse w-full text-sm">
          <thead>
            <tr>
              <th class="w-8"></th>
              @for (h of headers(); track $index; let i = $index) {
                <th class="border border-slate-200 dark:border-slate-700 px-1 py-1 bg-slate-50 dark:bg-slate-800/50">
                  <input class="w-full bg-transparent font-semibold text-center outline-none px-2 py-1" [ngModel]="h" (ngModelChange)="setHeader(i, $event)" />
                  <div class="flex justify-center gap-0.5 mt-1">
                    @for (a of alignments; track a) {
                      <button class="text-[10px] px-1.5 py-0.5 rounded" [class.bg-brand-500]="aligns()[i] === a" [class.text-white]="aligns()[i] === a" [class.bg-slate-200]="aligns()[i] !== a" [class.dark:bg-slate-700]="aligns()[i] !== a" (click)="setAlign(i, a)">{{ alignIcon(a) }}</button>
                    }
                  </div>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track $index; let r = $index) {
              <tr>
                <td class="text-center text-xs text-slate-400">{{ r + 1 }}</td>
                @for (cell of row; track $index; let c = $index) {
                  <td class="border border-slate-200 dark:border-slate-700 p-0">
                    <input class="w-full bg-transparent outline-none px-2 py-1" [ngModel]="cell" (ngModelChange)="setCell(r, c, $event)" />
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-bold uppercase tracking-widest text-slate-500">Markdown</div>
            <button class="btn-primary text-xs" (click)="copy(md())">Copy</button>
          </div>
          <pre class="text-xs font-mono whitespace-pre overflow-auto p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">{{ md() }}</pre>
        </div>
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-bold uppercase tracking-widest text-slate-500">HTML</div>
            <button class="btn-secondary text-xs" (click)="copy(html())">Copy</button>
          </div>
          <pre class="text-xs font-mono whitespace-pre-wrap overflow-auto p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">{{ html() }}</pre>
        </div>
      </div>
    </section>
  `,
})
export class MarkdownTable {
  protected readonly alignments: Align[] = ['left', 'center', 'right'];

  protected headers = signal<string[]>(['Name', 'Role', 'Email']);
  protected aligns = signal<Align[]>(['left', 'left', 'left']);
  protected rows = signal<string[][]>([
    ['Alex', 'Designer', 'alex@acme.com'],
    ['Sam', 'Engineer', 'sam@acme.com'],
    ['Jordan', 'PM', 'jordan@acme.com'],
  ]);

  protected cols = computed(() => this.headers().length);

  constructor(private toast: ToastService) {}

  protected alignIcon(a: Align) { return a === 'left' ? '⬅' : a === 'center' ? '⬌' : '➡'; }

  setHeader(i: number, v: string) { const h = [...this.headers()]; h[i] = v; this.headers.set(h); }
  setAlign(i: number, a: Align) { const al = [...this.aligns()]; al[i] = a; this.aligns.set(al); }
  setCell(r: number, c: number, v: string) {
    const rs = this.rows().map(row => [...row]);
    rs[r][c] = v;
    this.rows.set(rs);
  }

  addCol() {
    this.headers.set([...this.headers(), 'Column']);
    this.aligns.set([...this.aligns(), 'left']);
    this.rows.set(this.rows().map(r => [...r, '']));
  }
  removeCol() {
    if (this.cols() <= 1) return;
    this.headers.set(this.headers().slice(0, -1));
    this.aligns.set(this.aligns().slice(0, -1));
    this.rows.set(this.rows().map(r => r.slice(0, -1)));
  }
  addRow() { this.rows.set([...this.rows(), Array(this.cols()).fill('')]); }
  removeRow() { if (this.rows().length > 1) this.rows.set(this.rows().slice(0, -1)); }
  clear() { this.rows.set(this.rows().map(r => r.map(() => ''))); }

  async importPrompt() {
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch {}
    if (!text) text = prompt('Paste TSV or CSV') ?? '';
    if (!text.trim()) return;
    const lines = text.replace(/\r/g, '').split('\n').filter(l => l.length);
    if (!lines.length) return;
    const sep = lines[0].includes('\t') ? '\t' : ',';
    const parsed = lines.map(l => sep === ',' ? this.parseCsv(l) : l.split('\t'));
    const width = Math.max(...parsed.map(r => r.length));
    parsed.forEach(r => { while (r.length < width) r.push(''); });
    this.headers.set(parsed[0]);
    this.aligns.set(Array(width).fill('left') as Align[]);
    this.rows.set(parsed.slice(1).length ? parsed.slice(1) : [Array(width).fill('')]);
  }

  private parseCsv(line: string): string[] {
    const out: string[] = []; let cur = ''; let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else {
        if (ch === ',') { out.push(cur); cur = ''; }
        else if (ch === '"') q = true;
        else cur += ch;
      }
    }
    out.push(cur);
    return out;
  }

  md = computed(() => {
    const h = this.headers().map(s => s || ' ');
    const al = this.aligns();
    const widths = h.map((_, c) => Math.max(h[c].length, ...this.rows().map(r => (r[c] || '').length)));
    const pad = (s: string, w: number, a: Align) => {
      if (a === 'right') return s.padStart(w);
      if (a === 'center') {
        const total = w - s.length; const left = Math.floor(total / 2); const right = total - left;
        return ' '.repeat(left) + s + ' '.repeat(right);
      }
      return s.padEnd(w);
    };
    const head = '| ' + h.map((s, c) => pad(s, widths[c], al[c])).join(' | ') + ' |';
    const sep = '| ' + al.map((a, c) => {
      const w = widths[c];
      if (a === 'center') return ':' + '-'.repeat(Math.max(1, w - 2)) + ':';
      if (a === 'right')  return '-'.repeat(Math.max(1, w - 1)) + ':';
      return ':' + '-'.repeat(Math.max(1, w - 1));
    }).join(' | ') + ' |';
    const body = this.rows().map(r => '| ' + r.map((s, c) => pad(s || '', widths[c], al[c])).join(' | ') + ' |').join('\n');
    return [head, sep, body].filter(Boolean).join('\n');
  });

  html = computed(() => {
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const al = this.aligns();
    const thead = '<thead><tr>' + this.headers().map((h, c) => `<th style="text-align:${al[c]}">${esc(h)}</th>`).join('') + '</tr></thead>';
    const tbody = '<tbody>' + this.rows().map(r => '<tr>' + r.map((cell, c) => `<td style="text-align:${al[c]}">${esc(cell || '')}</td>`).join('') + '</tr>').join('') + '</tbody>';
    return `<table>\n  ${thead}\n  ${tbody}\n</table>`;
  });

  async copy(text: string) {
    try { await navigator.clipboard.writeText(text); this.toast.success('Copied'); } catch {}
  }
}
