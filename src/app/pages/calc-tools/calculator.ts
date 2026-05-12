import { Component, HostListener, computed, signal } from '@angular/core';

interface HistoryItem { expr: string; result: string; }

@Component({
  selector: 'app-calculator',
  template: `
    <div class="grid lg:grid-cols-[1fr_320px] gap-5 items-start">

      <!-- CALCULATOR -->
      <div class="card overflow-hidden mx-auto w-full transition-[max-width] duration-300"
           [class.max-w-md]="!scientific()"
           [class.max-w-2xl]="scientific()">
        <!-- Top bar -->
        <div class="flex items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
          <button class="kbtn-small" (click)="scientific.set(!scientific())">
            <span class="text-base">⚛</span>
            <span class="text-xs ml-1">{{ scientific() ? 'Standard' : 'Scientific' }}</span>
          </button>
          <span class="flex-1"></span>
          <span class="text-[10px] text-slate-400 font-mono">{{ memory() ? 'M = ' + fmt(memory()) : '' }}</span>
          <button class="kbtn-small text-rose-600 dark:text-rose-400" title="Clear history" (click)="clearHistory()">
            <span class="text-xs">⌫ H</span>
          </button>
        </div>

        <!-- Display -->
        <div class="px-5 py-3 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 select-text">
          <div class="text-xs text-slate-400 dark:text-slate-500 font-mono min-h-[1rem] break-all text-right">{{ expr() || '0' }}</div>
          <div class="text-3xl sm:text-4xl font-display font-bold tabular-nums text-right mt-0.5 break-all min-h-[2.5rem]"
               [class.text-rose-600]="result() === 'Error'"
               [class.text-slate-900]="result() !== 'Error'"
               [class.dark:text-white]="result() !== 'Error'">{{ result() }}</div>
        </div>

        <!-- Memory row -->
        <div class="grid grid-cols-4 gap-1.5 px-3 py-2 border-y border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20">
          <button class="kbtn kbtn-mem" (click)="memClear()">MC</button>
          <button class="kbtn kbtn-mem" (click)="memRecall()">MR</button>
          <button class="kbtn kbtn-mem" (click)="memPlus()">M+</button>
          <button class="kbtn kbtn-mem" (click)="memMinus()">M−</button>
        </div>

        <!-- Keypad area: scientific (left) + standard (right) side-by-side -->
        <div class="flex gap-2 p-3">
          @if (scientific()) {
            <div class="grid grid-cols-3 gap-1.5 w-[42%] sm:w-[44%]">
              <button class="kbtn kbtn-fn text-xs" (click)="press('sin(')">sin</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('cos(')">cos</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('tan(')">tan</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('log(')">log</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('ln(')">ln</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('√(')">√</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('^2')">x²</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('^')">xʸ</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('π')">π</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('e')">e</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('(')">(</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press(')')">)</button>
              <button class="kbtn kbtn-fn text-xs" (click)="factorial()">x!</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('1/(')">1/x</button>
              <button class="kbtn kbtn-fn text-xs" (click)="press('abs(')">|x|</button>
            </div>
          }
          <div class="grid grid-cols-4 gap-1.5 flex-1 min-w-0">
            <button class="kbtn kbtn-fn" (click)="clear()">AC</button>
            <button class="kbtn kbtn-fn" (click)="backspace()" aria-label="Backspace">⌫</button>
            <button class="kbtn kbtn-fn" (click)="press('%')">%</button>
            <button class="kbtn kbtn-op" (click)="press('÷')">÷</button>

            <button class="kbtn" (click)="press('7')">7</button>
            <button class="kbtn" (click)="press('8')">8</button>
            <button class="kbtn" (click)="press('9')">9</button>
            <button class="kbtn kbtn-op" (click)="press('×')">×</button>

            <button class="kbtn" (click)="press('4')">4</button>
            <button class="kbtn" (click)="press('5')">5</button>
            <button class="kbtn" (click)="press('6')">6</button>
            <button class="kbtn kbtn-op" (click)="press('−')">−</button>

            <button class="kbtn" (click)="press('1')">1</button>
            <button class="kbtn" (click)="press('2')">2</button>
            <button class="kbtn" (click)="press('3')">3</button>
            <button class="kbtn kbtn-op" (click)="press('+')">+</button>

            <button class="kbtn" (click)="negate()">±</button>
            <button class="kbtn" (click)="press('0')">0</button>
            <button class="kbtn" (click)="press('.')">.</button>
            <button class="kbtn kbtn-eq" (click)="equals()" aria-label="Equals">=</button>
          </div>
        </div>

        <!-- Footer hint -->
        <div class="px-3 py-1.5 text-[10px] text-slate-400 text-center border-t border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20">
          Keyboard: 0-9 · + - * / % · Enter = · Backspace ⌫ · Esc AC
        </div>
      </div>

      <!-- HISTORY -->
      <div class="card p-4 lg:sticky lg:top-20">
        <div class="flex items-center justify-between mb-3">
          <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">History</div>
          @if (history().length) {
            <button class="text-xs text-rose-600 hover:underline" (click)="clearHistory()">Clear</button>
          }
        </div>
        @if (!history().length) {
          <div class="text-center py-6 text-xs text-slate-500">
            <div class="text-2xl mb-1">🧮</div>
            <div>No calculations yet.</div>
          </div>
        } @else {
          <ul class="space-y-1.5 max-h-[480px] overflow-auto -mr-2 pr-2">
            @for (h of history(); track $index; let i = $index) {
              <li>
                <button class="block w-full text-left rounded-lg px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition group"
                        (click)="useHistory(i)">
                  <div class="text-[11px] text-slate-500 font-mono truncate">{{ h.expr }}</div>
                  <div class="text-base font-semibold tabular-nums text-slate-900 dark:text-white">= {{ h.result }}</div>
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .kbtn {
      padding: 0.65rem 0.4rem;
      border-radius: 0.75rem;
      background: rgb(248 250 252);
      color: rgb(15 23 42);
      font-size: 1rem;
      font-weight: 500;
      transition: transform 0.08s ease, background-color 0.12s, box-shadow 0.12s;
      box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
      outline: none;
      user-select: none;
    }
    .kbtn:hover { background: rgb(241 245 249); }
    .kbtn:active { transform: scale(0.94); background: rgb(226 232 240); }
    :host-context(.dark) .kbtn { background: rgb(30 41 59); color: rgb(226 232 240); }
    :host-context(.dark) .kbtn:hover { background: rgb(51 65 85); }
    :host-context(.dark) .kbtn:active { background: rgb(71 85 105); }

    .kbtn-fn {
      background: rgb(226 232 240);
      color: rgb(71 85 105);
      font-weight: 600;
    }
    .kbtn-fn:hover { background: rgb(203 213 225); }
    :host-context(.dark) .kbtn-fn { background: rgb(51 65 85); color: rgb(203 213 225); }
    :host-context(.dark) .kbtn-fn:hover { background: rgb(71 85 105); }

    .kbtn-mem {
      background: transparent;
      color: rgb(99 102 241);
      font-weight: 600;
      padding: 0.5rem;
      font-size: 0.75rem;
      box-shadow: none;
    }
    .kbtn-mem:hover { background: rgba(99, 102, 241, 0.1); }
    :host-context(.dark) .kbtn-mem { color: rgb(165 180 252); }
    :host-context(.dark) .kbtn-mem:hover { background: rgba(99, 102, 241, 0.2); }

    .kbtn-op {
      background: linear-gradient(135deg, rgb(99 102 241), rgb(129 140 248));
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .kbtn-op:hover { filter: brightness(1.08); }
    .kbtn-op:active { transform: scale(0.94); }

    .kbtn-eq {
      background: linear-gradient(135deg, rgb(168 85 247), rgb(217 70 239));
      color: white;
      font-weight: 700;
      font-size: 1.4rem;
      box-shadow: 0 6px 16px rgba(168, 85, 247, 0.4);
    }
    .kbtn-eq:hover { filter: brightness(1.08); }
    .kbtn-eq:active { transform: scale(0.94); }

    .kbtn-small {
      padding: 0.35rem 0.6rem;
      border-radius: 0.5rem;
      display: inline-flex;
      align-items: center;
      font-weight: 600;
      transition: background-color 0.12s;
      color: rgb(71 85 105);
    }
    .kbtn-small:hover { background: rgba(99, 102, 241, 0.1); color: rgb(99 102 241); }
    :host-context(.dark) .kbtn-small { color: rgb(203 213 225); }
    :host-context(.dark) .kbtn-small:hover { background: rgba(99, 102, 241, 0.2); color: rgb(165 180 252); }
  `],
})
export class Calculator {
  protected expr = signal<string>('');
  protected result = signal<string>('0');
  protected history = signal<HistoryItem[]>([]);
  protected scientific = signal<boolean>(false);
  protected memory = signal<number>(0);
  protected justEvaluated = false;

  press(token: string) {
    // After =, a digit starts new; an operator continues from result
    if (this.justEvaluated) {
      if (/^[0-9.]$/.test(token)) this.expr.set('');
      this.justEvaluated = false;
    }
    this.expr.update(s => s + token);
    this.preview();
  }

  backspace() {
    if (this.justEvaluated) {
      this.justEvaluated = false;
      this.expr.set('');
      this.result.set('0');
      return;
    }
    this.expr.update(s => {
      if (s.length === 0) return s;
      const tail = s.match(/(sin\(|cos\(|tan\(|log\(|ln\(|abs\(|√\(|1\/\(|.)$/);
      return tail ? s.slice(0, s.length - tail[0].length) : s.slice(0, -1);
    });
    this.preview();
  }

  clear() {
    this.expr.set('');
    this.result.set('0');
    this.justEvaluated = false;
  }

  negate() {
    if (this.justEvaluated && this.result() !== 'Error') {
      const v = -parseFloat(this.result());
      this.result.set(this.fmt(v));
      this.expr.set(String(v));
      return;
    }
    // Wrap the last numeric token with negation
    this.expr.update(s => {
      const m = s.match(/(-?\d+(\.\d+)?)$/);
      if (!m) return s + '(-';
      const num = m[1];
      const flipped = num.startsWith('-') ? num.slice(1) : '-' + num;
      return s.slice(0, s.length - num.length) + flipped;
    });
    this.preview();
  }

  factorial() {
    const r = this.evalSilent();
    if (r === null || !Number.isInteger(r) || r < 0 || r > 170) { this.result.set('Error'); return; }
    let v = 1;
    for (let i = 2; i <= r; i++) v *= i;
    this.commit(this.expr() + '!', v);
  }

  equals() {
    try {
      const v = this.evaluate(this.expr());
      this.commit(this.expr(), v);
    } catch {
      this.result.set('Error');
    }
  }

  private commit(expr: string, value: number) {
    const r = this.fmt(value);
    this.history.update(h => [{ expr: expr || '0', result: r }, ...h].slice(0, 50));
    this.result.set(r);
    this.expr.set(String(value));
    this.justEvaluated = true;
  }

  private preview() {
    const r = this.evalSilent();
    if (r !== null) this.result.set(this.fmt(r));
    else if (!this.expr()) this.result.set('0');
  }

  private evalSilent(): number | null {
    try { return this.evaluate(this.expr()); } catch { return null; }
  }

  private evaluate(input: string): number {
    if (!input.trim()) return 0;

    let s = input
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, '(Math.PI)')
      .replace(/(?<![a-zA-Z0-9.])e(?![a-zA-Z0-9])/g, '(Math.E)')
      .replace(/√\(/g, 'Math.sqrt(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/\^/g, '**');

    // Auto-close open parens
    const opens = (s.match(/\(/g) || []).length;
    const closes = (s.match(/\)/g) || []).length;
    if (opens > closes) s += ')'.repeat(opens - closes);

    // Whitelist: digits, math, parens, dot, Math.X tokens only
    const stripped = s.replace(/Math\.(PI|E|sqrt|sin|cos|tan|log10|log|abs)/g, '_');
    if (!/^[\d\s+\-*/%().,_]+$/.test(stripped)) throw new Error('Bad chars');

    // eslint-disable-next-line no-new-func
    const fn = new Function('"use strict"; return (' + s + ')');
    const v = fn();
    if (typeof v !== 'number' || !isFinite(v)) throw new Error('Not finite');
    return v;
  }

  fmt(v: number): string {
    if (!isFinite(v)) return 'Error';
    if (Math.abs(v) < 1e-12) return '0';
    const abs = Math.abs(v);
    if (abs !== 0 && (abs < 1e-6 || abs >= 1e15)) return v.toExponential(6);
    const fixed = parseFloat(v.toPrecision(12));
    return fixed.toLocaleString('en-US', { maximumFractionDigits: 12 });
  }

  // Memory ops
  memClear() { this.memory.set(0); }
  memRecall() { this.press(String(this.memory())); }
  memPlus() { const r = this.evalSilent(); if (r != null) this.memory.update(m => m + r); }
  memMinus() { const r = this.evalSilent(); if (r != null) this.memory.update(m => m - r); }

  // History
  useHistory(i: number) {
    const h = this.history()[i];
    if (!h) return;
    this.expr.set(h.result.replace(/,/g, ''));
    this.result.set(h.result);
    this.justEvaluated = true;
  }
  clearHistory() { this.history.set([]); }

  // Keyboard input
  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); this.press(e.key); return; }
    const map: Record<string, () => void> = {
      'Enter': () => this.equals(),
      '=': () => this.equals(),
      'Backspace': () => this.backspace(),
      'Escape': () => this.clear(),
      'Delete': () => this.clear(),
      '+': () => this.press('+'),
      '-': () => this.press('−'),
      '*': () => this.press('×'),
      '/': () => this.press('÷'),
      '%': () => this.press('%'),
      '(': () => this.press('('),
      ')': () => this.press(')'),
      '.': () => this.press('.'),
      '^': () => this.press('^'),
    };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
  }
}
