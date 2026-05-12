import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

type Format = 'json' | 'csv' | 'yaml' | 'xml';

@Component({
  selector: 'app-dev-data-convert',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Data Converter" subtitle="JSON ↔ CSV ↔ YAML ↔ XML — round-trip your structured data." icon="⇄" color="from-sky-500 to-indigo-600" back="/dev" backLabel="Developer tools" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <select class="input !w-auto !py-1 !px-2 text-xs font-bold" [(ngModel)]="srcFormat" (ngModelChange)="convert()">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="yaml">YAML</option>
              <option value="xml">XML</option>
            </select>
            <div class="flex gap-1">
              <button class="btn-ghost text-xs px-2 py-1" (click)="paste()">Paste</button>
              <button class="btn-ghost text-xs px-2 py-1" (click)="src = ''; convert()">Clear</button>
            </div>
          </div>
          <textarea class="input font-mono text-xs h-[420px]" spellcheck="false" [(ngModel)]="src" (ngModelChange)="convert()" placeholder="Paste your data here…"></textarea>
        </div>

        <div class="card p-4">
          <div class="flex items-center justify-between mb-2">
            <select class="input !w-auto !py-1 !px-2 text-xs font-bold" [(ngModel)]="dstFormat" (ngModelChange)="convert()">
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="yaml">YAML</option>
              <option value="xml">XML</option>
            </select>
            <button class="btn-ghost text-xs px-2 py-1" (click)="copy()">Copy</button>
          </div>
          <textarea class="input font-mono text-xs h-[420px] !bg-slate-50 dark:!bg-slate-800/40" readonly [value]="dst()"></textarea>
        </div>
      </div>
      @if (error()) { <div class="mt-4 card p-3 text-sm text-rose-600 border-rose-200">⚠ {{ error() }}</div> }
    </section>
  `,
})
export class DevDataConvert {
  protected srcFormat: Format = 'json';
  protected dstFormat: Format = 'csv';
  protected src = '[\n  { "name": "Alice", "age": 30, "city": "NYC" },\n  { "name": "Bob", "age": 25, "city": "LA" }\n]';
  protected dst = signal('');
  protected error = signal('');

  constructor(private toast: ToastService) { setTimeout(() => this.convert(), 0); }

  convert() {
    this.error.set('');
    if (!this.src.trim()) { this.dst.set(''); return; }
    try {
      const obj = this.parse(this.src, this.srcFormat);
      this.dst.set(this.serialize(obj, this.dstFormat));
    } catch (e: any) {
      this.error.set(e?.message ?? 'Conversion failed');
      this.dst.set('');
    }
  }

  private parse(text: string, fmt: Format): any {
    if (fmt === 'json') return JSON.parse(text);
    if (fmt === 'csv') return this.csvToObj(text);
    if (fmt === 'yaml') return this.yamlToObj(text);
    if (fmt === 'xml') return this.xmlToObj(text);
  }

  private serialize(obj: any, fmt: Format): string {
    if (fmt === 'json') return JSON.stringify(obj, null, 2);
    if (fmt === 'csv') return this.objToCsv(obj);
    if (fmt === 'yaml') return this.toYaml(obj, 0);
    if (fmt === 'xml') return '<?xml version="1.0"?>\n' + this.toXml(obj, 'root');
    return '';
  }

  private csvToObj(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(l => l.length);
    if (!lines.length) return [];
    const head = this.csvLine(lines[0]);
    return lines.slice(1).map(l => {
      const cells = this.csvLine(l);
      const r: any = {};
      head.forEach((h, i) => r[h] = this.coerce(cells[i] ?? ''));
      return r;
    });
  }
  private csvLine(s: string): string[] {
    const out: string[] = []; let cur = ''; let inQ = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQ) {
        if (c === '"' && s[i + 1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQ = false;
        else cur += c;
      } else {
        if (c === '"') inQ = true;
        else if (c === ',') { out.push(cur); cur = ''; }
        else cur += c;
      }
    }
    out.push(cur);
    return out;
  }
  private coerce(v: string): any {
    if (v === '') return '';
    if (/^-?\d+$/.test(v)) return parseInt(v, 10);
    if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === 'null') return null;
    return v;
  }
  private objToCsv(obj: any): string {
    const rows = Array.isArray(obj) ? obj : [obj];
    if (!rows.length) return '';
    const keys = Array.from(rows.reduce((s: Set<string>, r: any) => {
      Object.keys(r ?? {}).forEach(k => s.add(k)); return s;
    }, new Set<string>()));
    const esc = (v: any) => {
      if (v == null) return '';
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return [keys.join(','), ...rows.map((r: any) => keys.map(k => esc(r?.[k])).join(','))].join('\n');
  }

  // Very small YAML — flat objects and arrays of objects
  private toYaml(obj: any, depth: number): string {
    const pad = '  '.repeat(depth);
    if (obj === null) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) {
      return obj.map(v => pad + '- ' + (typeof v === 'object' && v
        ? '\n' + this.toYaml(v, depth + 1)
        : JSON.stringify(v))).join('\n');
    }
    return Object.entries(obj).map(([k, v]) => {
      if (v !== null && typeof v === 'object') {
        return pad + k + ':\n' + this.toYaml(v, depth + 1);
      }
      return pad + k + ': ' + JSON.stringify(v);
    }).join('\n');
  }
  private yamlToObj(text: string): any {
    // Reject as a full YAML parser is too heavy; require JSON-compatible YAML for input
    try { return JSON.parse(text); } catch {}
    // basic line parser for "key: value" flat structure
    const obj: any = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
      if (m) obj[m[1]] = this.coerce(m[2].trim());
    }
    return obj;
  }

  private toXml(obj: any, name: string): string {
    if (obj === null || obj === undefined) return `<${name}/>`;
    if (typeof obj !== 'object') return `<${name}>${this.escXml(String(obj))}</${name}>`;
    if (Array.isArray(obj)) return obj.map(v => this.toXml(v, name)).join('\n');
    const body = Object.entries(obj).map(([k, v]) => this.toXml(v, k)).join('\n');
    return `<${name}>\n${body}\n</${name}>`;
  }
  private escXml(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  private xmlToObj(text: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Invalid XML');
    return this.nodeToObj(doc.documentElement);
  }
  private nodeToObj(node: Element): any {
    if (!node.children.length) return this.coerce((node.textContent || '').trim());
    const out: any = {};
    Array.from(node.children).forEach(c => {
      const key = c.tagName;
      const val = this.nodeToObj(c);
      if (out[key] == null) out[key] = val;
      else if (Array.isArray(out[key])) out[key].push(val);
      else out[key] = [out[key], val];
    });
    return out;
  }

  async paste() { try { this.src = await navigator.clipboard.readText(); this.convert(); } catch {} }
  async copy() { try { await navigator.clipboard.writeText(this.dst()); this.toast.success('Copied'); } catch {} }
}
