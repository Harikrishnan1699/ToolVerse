import { Component, ElementRef, ViewChild, signal, computed, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
const INLINE_TAGS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'em',
  'i', 'kbd', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong',
  'sub', 'sup', 'time', 'u', 'var',
]);
const PRESERVE_TAGS = new Set(['pre', 'textarea', 'script', 'style']);

type Token =
  | { kind: 'doctype'; raw: string }
  | { kind: 'comment'; raw: string }
  | { kind: 'cdata'; raw: string }
  | { kind: 'open'; tag: string; raw: string; selfClosing: boolean }
  | { kind: 'close'; tag: string; raw: string }
  | { kind: 'text'; raw: string }
  | { kind: 'preserved'; tag: string; raw: string };

function tokenize(html: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  const n = html.length;
  while (i < n) {
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      const stop = end === -1 ? n : end + 3;
      out.push({ kind: 'comment', raw: html.slice(i, stop) });
      i = stop;
      continue;
    }
    if (html.startsWith('<![CDATA[', i)) {
      const end = html.indexOf(']]>', i + 9);
      const stop = end === -1 ? n : end + 3;
      out.push({ kind: 'cdata', raw: html.slice(i, stop) });
      i = stop;
      continue;
    }
    if (/^<!doctype/i.test(html.slice(i, i + 9))) {
      const end = html.indexOf('>', i);
      const stop = end === -1 ? n : end + 1;
      out.push({ kind: 'doctype', raw: html.slice(i, stop) });
      i = stop;
      continue;
    }
    if (html[i] === '<' && html[i + 1] === '/') {
      const end = html.indexOf('>', i);
      const stop = end === -1 ? n : end + 1;
      const raw = html.slice(i, stop);
      const m = raw.match(/^<\/\s*([a-zA-Z][\w:-]*)/);
      out.push({ kind: 'close', tag: (m?.[1] || '').toLowerCase(), raw });
      i = stop;
      continue;
    }
    if (html[i] === '<' && /[a-zA-Z]/.test(html[i + 1] || '')) {
      const end = findTagEnd(html, i);
      const raw = html.slice(i, end);
      const m = raw.match(/^<\s*([a-zA-Z][\w:-]*)/);
      const tag = (m?.[1] || '').toLowerCase();
      const selfClosing = /\/\s*>$/.test(raw) || VOID_TAGS.has(tag);
      if (PRESERVE_TAGS.has(tag) && !selfClosing) {
        const closeRe = new RegExp(`</\\s*${tag}\\s*>`, 'i');
        const rest = html.slice(end);
        const m2 = rest.match(closeRe);
        if (m2) {
          const block = html.slice(i, end + m2.index! + m2[0].length);
          out.push({ kind: 'preserved', tag, raw: block });
          i = end + m2.index! + m2[0].length;
          continue;
        }
      }
      out.push({ kind: 'open', tag, raw, selfClosing });
      i = end;
      continue;
    }
    const nextLt = html.indexOf('<', i);
    const stop = nextLt === -1 ? n : nextLt;
    const raw = html.slice(i, stop);
    if (raw.length) out.push({ kind: 'text', raw });
    i = stop;
  }
  return out;
}

function findTagEnd(html: string, start: number): number {
  let i = start;
  let inSingle = false, inDouble = false;
  while (i < html.length) {
    const c = html[i];
    if (!inSingle && c === '"') inDouble = !inDouble;
    else if (!inDouble && c === "'") inSingle = !inSingle;
    else if (!inSingle && !inDouble && c === '>') return i + 1;
    i++;
  }
  return html.length;
}

function normalizeTag(raw: string): string {
  return raw.replace(/\s+/g, ' ').replace(/\s+>/g, '>').replace(/\s+\/>/g, ' />');
}

function beautify(html: string, indent: string): string {
  const tokens = tokenize(html.trim());
  const out: string[] = [];
  let level = 0;
  const pad = () => indent.repeat(Math.max(0, level));

  for (let idx = 0; idx < tokens.length; idx++) {
    const t = tokens[idx];
    switch (t.kind) {
      case 'doctype':
        out.push(t.raw.trim());
        break;
      case 'comment':
        out.push(pad() + t.raw.trim());
        break;
      case 'cdata':
        out.push(pad() + t.raw.trim());
        break;
      case 'preserved':
        out.push(pad() + t.raw.trim());
        break;
      case 'open': {
        const isInline = INLINE_TAGS.has(t.tag);
        const prev = out[out.length - 1];
        if (isInline && prev !== undefined && !prev.endsWith('\n')) {
          out[out.length - 1] = prev + normalizeTag(t.raw);
        } else {
          out.push(pad() + normalizeTag(t.raw));
        }
        if (!t.selfClosing && !INLINE_TAGS.has(t.tag)) level++;
        break;
      }
      case 'close': {
        if (!INLINE_TAGS.has(t.tag)) level = Math.max(0, level - 1);
        const isInline = INLINE_TAGS.has(t.tag);
        const prev = out[out.length - 1];
        if (isInline && prev !== undefined) {
          out[out.length - 1] = prev + t.raw.trim();
        } else {
          out.push(pad() + t.raw.trim());
        }
        break;
      }
      case 'text': {
        const trimmed = t.raw.replace(/\s+/g, ' ').trim();
        if (!trimmed) break;
        const prev = out[out.length - 1];
        const prevTok = tokens[idx - 1];
        const nextTok = tokens[idx + 1];
        const isFlanked =
          (prevTok && prevTok.kind === 'open' && INLINE_TAGS.has(prevTok.tag)) ||
          (nextTok && nextTok.kind === 'close' && INLINE_TAGS.has(nextTok.tag));
        if (isFlanked && prev !== undefined) {
          out[out.length - 1] = prev + trimmed;
        } else {
          out.push(pad() + trimmed);
        }
        break;
      }
    }
  }
  return out.join('\n');
}

function minify(html: string): string {
  const tokens = tokenize(html);
  return tokens.map(t => {
    if (t.kind === 'text') return t.raw.replace(/\s+/g, ' ');
    if (t.kind === 'preserved') return t.raw;
    if (t.kind === 'open' || t.kind === 'close' || t.kind === 'doctype') return normalizeTag(t.raw).trim();
    if (t.kind === 'comment') return '';
    return t.raw;
  }).join('').replace(/>\s+</g, '><').trim();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(html: string): string {
  if (!html) return '';
  const escaped = escapeHtml(html);
  return escaped
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>')
    .replace(/(&lt;!doctype[^&]*?&gt;)/gi, '<span class="hl-doctype">$1</span>')
    .replace(/(&lt;\/?)([a-zA-Z][\w:-]*)/g, '$1<span class="hl-tag">$2</span>')
    .replace(/([a-zA-Z-:]+)(=)(&quot;[^&]*?&quot;|&#39;[^&]*?&#39;)/g,
      '<span class="hl-attr">$1</span>$2<span class="hl-string">$3</span>');
}

function bytes(s: string): number {
  try { return new Blob([s]).size; } catch { return s.length; }
}

function formatBytes(b: number): string {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1024 / 1024).toFixed(2) + ' MB';
}

@Component({
  selector: 'app-dev-html',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="HTML Formatter" subtitle="Beautify, minify, view & download HTML — fully client-side." icon="</>" color="from-orange-500 to-rose-500" back="/dev" backLabel="All developer tools" />

    <section class="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 pb-16">
      <div class="grid grid-cols-1 xl:grid-cols-[1fr_220px_1fr] gap-4">

        <!-- INPUT EDITOR -->
        <div class="card overflow-hidden flex flex-col"
             [style.height]="full() === 'input' ? '100vh' : '600px'"
             [style.position]="full() === 'input' ? 'fixed' : 'relative'"
             [style.inset]="full() === 'input' ? '0' : 'auto'"
             [style.zIndex]="full() === 'input' ? '9999' : 'auto'"
             [style.borderRadius]="full() === 'input' ? '0' : ''"
             [class.visible]="full() === 'input'">
          <div class="flex items-center gap-1 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
            <button class="tb-btn" title="Indent current line" (click)="indentSelection()">{{ '⇥' }}</button>
            <button class="tb-btn" title="Unindent current line" (click)="outdentSelection()">≡</button>
            <span class="flex-1"></span>
            <button class="tb-btn font-italic" title="Load sample" (click)="loadSample()"><i>Sample</i></button>
            <button class="tb-btn" title="History" (click)="toggleHistory()">⟲</button>
            <button class="tb-btn" title="Open file" (click)="fileInput.click()">📂</button>
            <button class="tb-btn" title="Save" (click)="download('input')">💾</button>
            <button class="tb-btn" title="Clear" (click)="clearInput()">🗑</button>
            <button class="tb-btn" title="Copy" (click)="copy('input')">⧉</button>
            <button class="tb-btn" title="Fullscreen" (click)="toggleFull('input')">{{ full() === 'input' ? '🗗' : '⛶' }}</button>
          </div>

          <div class="editor-wrap flex-1 relative">
            <div #gutterIn class="gutter" aria-hidden="true">
              @for (n of inputLineNos(); track n) { <div>{{ n }}</div> }
            </div>
            <pre #preIn class="hl"><code [innerHTML]="inputHl()"></code></pre>
            <textarea
              #txtIn
              class="raw"
              spellcheck="false"
              autocomplete="off"
              autocorrect="off"
              [(ngModel)]="input"
              (ngModelChange)="onInputChange()"
              (scroll)="syncScroll('input')"
              (keyup)="updateCaret('input')"
              (click)="updateCaret('input')"
              (keydown)="onEditorKeydown($event)"
              placeholder="<div>Paste or type HTML here…</div>"></textarea>
          </div>

          <div class="flex items-center gap-3 px-3 py-1.5 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">
            <span>Ln: {{ inLine() }} Col: {{ inCol() }}</span>
            <span class="flex-1"></span>
            <span>size: <strong class="text-slate-700 dark:text-slate-200">{{ inputSize() }}</strong></span>
            <button class="tb-btn !w-6 !h-6 text-[10px]" (click)="changeFont(-1)" title="Smaller font">T</button>
            <button class="tb-btn !w-6 !h-6 text-sm font-bold" (click)="changeFont(1)" title="Bigger font">T</button>
          </div>

          <input #fileInput type="file" accept=".html,.htm,text/html" class="hidden" (change)="onFile($event)" />
        </div>

        <!-- CONTROLS -->
        <div class="card p-4 flex flex-col gap-3" [style.maxHeight]="'600px'">
          <div class="grid grid-cols-2 gap-2">
            <button class="btn-secondary !py-2.5" (click)="fileInput.click()">
              <span class="flex items-center justify-center gap-1.5 text-sm"><span class="text-base">⬆</span> File</span>
            </button>
            <button class="btn-secondary !py-2.5" (click)="openUrlPrompt()">
              <span class="flex items-center justify-center gap-1.5 text-sm"><span class="text-base">🔗</span> URL</span>
            </button>
          </div>

          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" [(ngModel)]="autoUpdate" (ngModelChange)="onAutoToggle()" class="w-4 h-4 accent-brand-500" />
            <span>Auto Update</span>
            <span class="flex-1"></span>
            <select class="input !w-auto !py-1 !px-2 text-xs" [(ngModel)]="indent" (ngModelChange)="onIndentChange()">
              <option value="  ">2 Space</option>
              <option value="    ">4 Space</option>
              <option value="\t">Tab</option>
            </select>
          </label>

          <button class="btn-primary !py-3 text-sm font-semibold" (click)="runBeautify()">
            <span class="flex items-center justify-center gap-2"><span class="text-base">⇥</span> Beautify HTML</span>
          </button>

          <button class="!py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition" (click)="runView()">
            <span class="flex items-center justify-center gap-2">▶ Run / View</span>
          </button>

          <button class="btn-secondary !py-3 text-sm font-semibold" (click)="runMinify()">
            <span class="flex items-center justify-center gap-2">⤡ Minify HTML</span>
          </button>

          <button class="btn-secondary !py-3 text-sm font-semibold" (click)="download('output')" [disabled]="!output()">
            <span class="flex items-center justify-center gap-2">⬇ Download</span>
          </button>

          <div class="flex-1"></div>
          @if (error()) {
            <div class="text-xs text-rose-600 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">⚠ {{ error() }}</div>
          }
          @if (history().length && historyOpen()) {
            <div class="rounded-lg border border-slate-200 dark:border-slate-700 max-h-40 overflow-auto">
              <div class="text-[10px] uppercase tracking-wider text-slate-500 px-2 py-1 border-b border-slate-200 dark:border-slate-700">History</div>
              @for (h of history(); track $index; let i = $index) {
                <button class="block w-full text-left text-xs px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 truncate" (click)="loadHistory(i)">{{ h.label }}</button>
              }
            </div>
          }
        </div>

        <!-- OUTPUT VIEWER -->
        <div class="card overflow-hidden flex flex-col"
             [style.height]="full() === 'output' ? '100vh' : '600px'"
             [style.position]="full() === 'output' ? 'fixed' : 'relative'"
             [style.inset]="full() === 'output' ? '0' : 'auto'"
             [style.zIndex]="full() === 'output' ? '9999' : 'auto'"
             [style.borderRadius]="full() === 'output' ? '0' : ''"
             [class.visible]="full() === 'output'">
          <div class="flex items-center gap-1 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300">
            <span class="text-sm font-semibold ml-1">Output</span>
            <span class="flex-1"></span>
            <button class="tb-btn" title="Open in new tab" (click)="openInNewTab()" [disabled]="!output()">↗</button>
            <button class="tb-btn" title="Save" (click)="download('output')" [disabled]="!output()">💾</button>
            <button class="tb-btn" title="Clear output" (click)="clearOutput()">🗑</button>
            <button class="tb-btn" title="Copy" (click)="copy('output')" [disabled]="!output()">⧉</button>
            <button class="tb-btn" title="Download" (click)="download('output')" [disabled]="!output()">⬇</button>
            <button class="tb-btn" title="Fullscreen" (click)="toggleFull('output')">{{ full() === 'output' ? '🗗' : '⛶' }}</button>
          </div>

          <div class="editor-wrap flex-1 relative">
            <div #gutterOut class="gutter" aria-hidden="true">
              @for (n of outputLineNos(); track n) { <div>{{ n }}</div> }
            </div>
            <pre #preOut class="hl ro" (scroll)="syncScroll('output')"><code [innerHTML]="outputHl()"></code></pre>
          </div>

          <div class="flex items-center gap-3 px-3 py-1.5 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40">
            <span>Ln: {{ outLines() }} Col: {{ outCol() }}</span>
            <span class="flex-1"></span>
            <span>size: <strong class="text-slate-700 dark:text-slate-200">{{ outputSize() }}</strong></span>
            <button class="tb-btn !w-6 !h-6 text-[10px]" (click)="changeFont(-1)" title="Smaller font">T</button>
            <button class="tb-btn !w-6 !h-6 text-sm font-bold" (click)="changeFont(1)" title="Bigger font">T</button>
          </div>
        </div>
      </div>

      <!-- LIVE PREVIEW -->
      @if (showPreview() && output()) {
        <div class="mt-6 card p-4">
          <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live preview</div>
              <p class="text-xs text-slate-500 mt-0.5">Sandboxed — scripts disabled.</p>
            </div>
            <div class="flex gap-2">
              <button class="btn-ghost text-xs px-2 py-1" (click)="openInNewTab()">Open in new tab</button>
              <button class="btn-ghost text-xs px-2 py-1" (click)="showPreview.set(false)">Close</button>
            </div>
          </div>
          <iframe
            [srcdoc]="output()"
            sandbox="allow-same-origin"
            class="w-full h-[500px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white"></iframe>
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }

    .tb-btn {
      display: inline-grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 0.375rem;
      color: inherit;
      transition: background-color 0.15s, color 0.15s;
      font-size: 0.875rem;
    }
    .tb-btn:hover:not(:disabled) {
      background-color: rgba(99, 102, 241, 0.12);
      color: #4f46e5;
    }
    :host-context(.dark) .tb-btn:hover:not(:disabled) {
      background-color: rgba(99, 102, 241, 0.18);
      color: #a5b4fc;
    }
    .tb-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    .editor-wrap {
      display: grid;
      grid-template-columns: auto 1fr;
      overflow: hidden;
      background: #ffffff;
    }
    :host-context(.dark) .editor-wrap { background: rgba(15, 23, 42, 0.4); }

    .gutter {
      user-select: none;
      text-align: right;
      padding: 0.75rem 0.5rem 0.75rem 0.75rem;
      color: #94a3b8;
      font-family: ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, Consolas, monospace;
      font-size: var(--editor-fs, 13px);
      line-height: 1.55;
      border-right: 1px solid rgba(148, 163, 184, 0.2);
      background: rgba(241, 245, 249, 0.55);
      overflow: hidden;
      min-width: 3rem;
      box-sizing: border-box;
    }
    :host-context(.dark) .gutter {
      background: rgba(15, 23, 42, 0.6);
      color: #64748b;
      border-right-color: rgba(51, 65, 85, 0.6);
    }
    .gutter > div { padding-right: 0.25rem; }

    .editor-wrap > .hl,
    .editor-wrap > .raw {
      margin: 0;
      padding: 0.75rem 1rem;
      font-family: ui-monospace, 'Cascadia Code', 'Fira Code', Menlo, Consolas, monospace;
      font-size: var(--editor-fs, 13px);
      line-height: 1.55;
      white-space: pre;
      word-wrap: normal;
      overflow: auto;
      tab-size: 4;
      grid-row: 1;
      grid-column: 2;
    }

    .editor-wrap > .hl {
      pointer-events: none;
      color: #0f172a;
      overflow: auto;
      width: 100%;
      height: 100%;
    }
    :host-context(.dark) .editor-wrap > .hl { color: #e2e8f0; }
    .editor-wrap > .hl.ro { pointer-events: auto; }

    .editor-wrap > .raw {
      background: transparent;
      color: transparent;
      caret-color: #0f172a;
      border: none;
      outline: none;
      resize: none;
      grid-row: 1;
      grid-column: 2;
      width: 100%;
      height: 100%;
      z-index: 2;
    }
    :host-context(.dark) .editor-wrap > .raw { caret-color: #e2e8f0; }
    .editor-wrap > .raw::selection { background: rgba(99, 102, 241, 0.3); color: transparent; }

    /* Syntax colors */
    :host ::ng-deep .hl-tag { color: #db2777; }
    :host ::ng-deep .hl-attr { color: #2563eb; }
    :host ::ng-deep .hl-string { color: #059669; }
    :host ::ng-deep .hl-comment { color: #94a3b8; font-style: italic; }
    :host ::ng-deep .hl-doctype { color: #7c3aed; }
    :host-context(.dark) ::ng-deep .hl-tag { color: #f472b6; }
    :host-context(.dark) ::ng-deep .hl-attr { color: #60a5fa; }
    :host-context(.dark) ::ng-deep .hl-string { color: #34d399; }
    :host-context(.dark) ::ng-deep .hl-comment { color: #64748b; }
    :host-context(.dark) ::ng-deep .hl-doctype { color: #a78bfa; }
  `],
})
export class DevHtml implements AfterViewInit {
  @ViewChild('txtIn') txtIn?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('preIn') preIn?: ElementRef<HTMLPreElement>;
  @ViewChild('preOut') preOut?: ElementRef<HTMLPreElement>;
  @ViewChild('gutterIn') gutterIn?: ElementRef<HTMLDivElement>;
  @ViewChild('gutterOut') gutterOut?: ElementRef<HTMLDivElement>;

  protected input = '';
  protected indent = '  ';
  protected autoUpdate = true;
  protected showPreview = signal(false);
  protected output = signal('');
  protected outputHl = signal('');
  protected inputHl = signal('');
  protected error = signal('');
  protected full = signal<null | 'input' | 'output'>(null);

  protected inLine = signal(1);
  protected inCol = signal(1);
  protected outLines = signal(1);
  protected outCol = signal(1);

  protected inputSize = computed(() => formatBytes(bytes(this.input)));
  protected outputSize = computed(() => formatBytes(bytes(this.output())));

  protected inputLineNos = signal<number[]>([1]);
  protected outputLineNos = signal<number[]>([1]);

  protected history = signal<{ label: string; content: string }[]>([]);
  protected historyOpen = signal(false);

  private fontSize = 13;

  ngAfterViewInit() {
    this.refreshLineNos();
  }

  onInputChange() {
    this.refreshLineNos();
    this.inputHl.set(highlight(this.input));
    if (this.autoUpdate) this.runBeautify(false);
  }

  onAutoToggle() {
    if (this.autoUpdate) this.runBeautify(false);
  }

  onIndentChange() {
    if (this.output() || this.autoUpdate) this.runBeautify(false);
  }

  runBeautify(addHistory = true) {
    const src = this.input;
    if (!src.trim()) { this.output.set(''); this.outputHl.set(''); this.error.set(''); this.refreshLineNos(); return; }
    try {
      const result = beautify(src, this.indent);
      this.output.set(result);
      this.outputHl.set(highlight(result));
      this.error.set('');
      this.refreshLineNos();
      if (addHistory) this.pushHistory('Beautified');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Could not beautify');
    }
  }

  runMinify() {
    const src = this.input;
    if (!src.trim()) return;
    try {
      const result = minify(src);
      this.output.set(result);
      this.outputHl.set(highlight(result));
      this.error.set('');
      this.refreshLineNos();
      this.pushHistory('Minified');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Could not minify');
    }
  }

  runView() {
    if (!this.output()) this.runBeautify(false);
    this.showPreview.set(true);
    setTimeout(() => {
      const el = document.querySelector('iframe[sandbox]');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  openInNewTab() {
    if (!this.output()) return;
    const blob = new Blob([this.output()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  refreshLineNos() {
    const inLines = this.input.split('\n').length || 1;
    const outLines = (this.output() || '').split('\n').length || 1;
    this.inputLineNos.set(Array.from({ length: inLines }, (_, i) => i + 1));
    this.outputLineNos.set(Array.from({ length: outLines }, (_, i) => i + 1));
    this.outLines.set(outLines);
  }

  syncScroll(which: 'input' | 'output') {
    if (which === 'input') {
      const ta = this.txtIn?.nativeElement, pre = this.preIn?.nativeElement, gut = this.gutterIn?.nativeElement;
      if (ta && pre) { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; }
      if (ta && gut) gut.scrollTop = ta.scrollTop;
    } else {
      const pre = this.preOut?.nativeElement, gut = this.gutterOut?.nativeElement;
      if (pre && gut) gut.scrollTop = pre.scrollTop;
    }
  }

  updateCaret(which: 'input' | 'output') {
    if (which !== 'input') return;
    const ta = this.txtIn?.nativeElement;
    if (!ta) return;
    const upto = ta.value.slice(0, ta.selectionStart);
    const lines = upto.split('\n');
    this.inLine.set(lines.length);
    this.inCol.set((lines[lines.length - 1]?.length ?? 0) + 1);
  }

  onEditorKeydown(e: KeyboardEvent) {
    const ta = this.txtIn?.nativeElement;
    if (!ta) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart, end = ta.selectionEnd;
      const tab = this.indent;
      const value = ta.value;
      ta.value = value.slice(0, start) + tab + value.slice(end);
      ta.selectionStart = ta.selectionEnd = start + tab.length;
      this.input = ta.value;
      this.onInputChange();
    }
  }

  indentSelection() {
    const ta = this.txtIn?.nativeElement; if (!ta) return;
    const { start, end, lineStart, lineEnd } = this.lineRange(ta);
    const block = ta.value.slice(lineStart, lineEnd);
    const updated = block.split('\n').map(l => this.indent + l).join('\n');
    ta.value = ta.value.slice(0, lineStart) + updated + ta.value.slice(lineEnd);
    ta.selectionStart = start + this.indent.length;
    ta.selectionEnd = end + this.indent.length * block.split('\n').length;
    this.input = ta.value; this.onInputChange();
  }

  outdentSelection() {
    const ta = this.txtIn?.nativeElement; if (!ta) return;
    const { lineStart, lineEnd } = this.lineRange(ta);
    const block = ta.value.slice(lineStart, lineEnd);
    const updated = block.split('\n').map(l => l.replace(new RegExp('^' + this.indent.replace(/\t/g, '\\t')), '')).join('\n');
    ta.value = ta.value.slice(0, lineStart) + updated + ta.value.slice(lineEnd);
    this.input = ta.value; this.onInputChange();
  }

  private lineRange(ta: HTMLTextAreaElement) {
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
    const nextNl = ta.value.indexOf('\n', end);
    const lineEnd = nextNl === -1 ? ta.value.length : nextNl;
    return { start, end, lineStart, lineEnd };
  }

  toggleFull(which: 'input' | 'output') {
    const next = this.full() === which ? null : which;
    this.full.set(next);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = next ? 'hidden' : '';
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEsc(e: Event) {
    if (this.full()) {
      e.preventDefault();
      this.toggleFull(this.full()!);
    }
  }

  toggleHistory() { this.historyOpen.update(v => !v); }

  pushHistory(label: string) {
    const entry = { label: `${label} · ${new Date().toLocaleTimeString()}`, content: this.output() };
    this.history.update(arr => [entry, ...arr].slice(0, 8));
  }

  loadHistory(i: number) {
    const h = this.history()[i];
    if (!h) return;
    this.input = h.content;
    this.onInputChange();
  }

  changeFont(delta: number) {
    this.fontSize = Math.max(10, Math.min(22, this.fontSize + delta));
    document.documentElement.style.setProperty('--editor-fs', this.fontSize + 'px');
  }

  clearInput() { this.input = ''; this.onInputChange(); }
  clearOutput() { this.output.set(''); this.outputHl.set(''); this.refreshLineNos(); }

  async copy(which: 'input' | 'output') {
    const text = which === 'input' ? this.input : this.output();
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  download(which: 'input' | 'output') {
    const text = which === 'input' ? this.input : this.output();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = which === 'input' ? 'input.html' : 'output.html';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    f.text().then(t => {
      this.input = t;
      this.onInputChange();
      input.value = '';
    });
  }

  async openUrlPrompt() {
    const url = prompt('Paste a URL to fetch HTML from:');
    if (!url) return;
    try {
      const r = await fetch(url);
      const t = await r.text();
      this.input = t;
      this.onInputChange();
    } catch (e: any) {
      this.error.set('Could not fetch URL — CORS may have blocked the request.');
    }
  }

  loadSample() {
    this.input = `<!doctype html><html><head><title>Demo</title><meta charset="utf-8"></head><body><header class="hero"><h1>Hello <em>world</em></h1><p>Paragraph with a <a href="#">link</a> inline.</p></header><ul><li>One</li><li>Two</li><li>Three</li></ul><!-- footer below --><footer><small>&copy; 2026</small></footer></body></html>`;
    this.onInputChange();
  }
}
