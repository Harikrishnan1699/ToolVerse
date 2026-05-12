import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

type Level = 'easy' | 'medium' | 'hard';
type Duration = 15 | 30 | 60 | 120 | 0;

const TEXTS: Record<Level, string[]> = {
  easy: [
    'the quick brown fox jumps over the lazy dog while the sun is shining and the birds are singing in the trees nearby',
    'a cat sat on the mat and looked at the bright sky above as the wind blew gently through the green grass and tall trees',
    'we love to read good books and drink hot tea on cold rainy days because it makes us feel warm and calm and so happy',
    'children play in the park with their friends every weekend and they all laugh and run and have a really nice time together',
    'cooking simple food at home is fun when you use fresh herbs and clean water and a little bit of love in every dish you make',
  ],
  medium: [
    'The sport of mountain biking is one of the best active sports you can partake in for a number of fitness reasons. Depending on what style of mountain biking you enjoy, it can also be a great deal of fun while keeping you fit at the same time. People are usually unaware of how much energy this sport demands.',
    'Reading widely is one of the surest ways to learn how the world works and how people think. A book opens a door to another mind, and once you have stepped through that door it is difficult to step back out without being changed in some small but meaningful way.',
    'Good habits are formed slowly, one repetition at a time, over many weeks or months. The trick is not to rely on motivation but to design an environment that nudges you toward the action you want to take, even on days you would rather do anything else.',
    'A well written paragraph carries the reader forward effortlessly. Each sentence does its small share of work and then hands off cleanly to the next. The pleasure of reading such writing comes from the feeling that the prose itself is alive and moving with purpose.',
  ],
  hard: [
    'Asynchronous code is notoriously difficult to reason about, particularly when promises, callbacks, and event listeners are intermixed without a coherent strategy. Modern JavaScript provides async/await syntax that linearises this complexity—yet developers still introduce subtle race conditions when they forget to await an inner call or when shared mutable state is touched by multiple in-flight operations.',
    'The capability-maturity model proposes five distinct stages: initial, repeatable, defined, managed, and optimising. Each transition requires not merely the adoption of new processes but a corresponding cultural shift; without buy-in from leadership and engineering alike, the framework collapses back into ad-hoc behaviour within a single quarter.',
    'In information theory, entropy quantifies uncertainty: H(X) = -Σ p(xi) log p(xi). Lossless compression algorithms approach—but never surpass—this lower bound. Practical encoders (Huffman, arithmetic, ANS) trade off speed against optimality, and engineers must weigh these against memory footprint, decode latency, and the statistical distribution of their corpus.',
    'A pure function depends only on its inputs and produces no side effects; this property enables referential transparency, equational reasoning, and aggressive compiler optimisation. Functional purity, however, is not a binary attribute of a codebase but a discipline maintained at module boundaries: pragmatic systems isolate effectful operations behind narrow, well-typed interfaces.',
  ],
};

@Component({
  selector: 'app-typing-test',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Typing Test" subtitle="Measure your typing speed and accuracy in real time — three difficulty levels." icon="⌨" color="from-indigo-500 to-purple-600" />

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Level</span>
          @for (l of levels; track l.id) {
            <button class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    [class.bg-brand-500]="level() === l.id" [class.text-white]="level() === l.id"
                    [class.bg-slate-100]="level() !== l.id" [class.dark:bg-slate-800]="level() !== l.id"
                    [class.text-slate-700]="level() !== l.id" [class.dark:text-slate-200]="level() !== l.id"
                    (click)="setLevel(l.id)">{{ l.label }}</button>
          }
        </div>

        <div class="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

        <div class="flex items-center gap-1">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Time</span>
          @for (d of durations; track d.id) {
            <button class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    [class.bg-brand-500]="duration() === d.id" [class.text-white]="duration() === d.id"
                    [class.bg-slate-100]="duration() !== d.id" [class.dark:bg-slate-800]="duration() !== d.id"
                    [class.text-slate-700]="duration() !== d.id" [class.dark:text-slate-200]="duration() !== d.id"
                    (click)="setDuration(d.id)">{{ d.label }}</button>
          }
        </div>

        <div class="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

        <label class="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
          <input type="checkbox" class="w-4 h-4 accent-brand-500" [checked]="strict()" (change)="strict.set(!strict())" />
          <span>Strict mode</span>
          <span class="text-[10px] text-slate-400" title="Wrong keys count as errors and stop you from advancing until you press the right key.">ⓘ</span>
        </label>

        <span class="flex-1"></span>

        <button class="btn-secondary !px-4 !py-1.5 text-sm" (click)="reset()" title="Reset (Esc)">↻ Reset</button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div class="card p-4 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">WPM</div>
          <div class="mt-1 text-3xl font-display font-bold tabular-nums text-brand-600">{{ wpm() }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Accuracy</div>
          <div class="mt-1 text-3xl font-display font-bold tabular-nums" [class.text-emerald-600]="accuracy() >= 95" [class.text-amber-600]="accuracy() < 95 && accuracy() >= 80" [class.text-rose-600]="accuracy() < 80">{{ accuracy() }}%</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Errors</div>
          <div class="mt-1 text-3xl font-display font-bold tabular-nums text-rose-600">{{ errors() }}</div>
        </div>
        <div class="card p-4 text-center">
          <div class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Time</div>
          <div class="mt-1 text-3xl font-display font-bold tabular-nums">{{ timeDisplay() }}</div>
        </div>
      </div>

      @if (strict() && wrongFlash()) {
        <div class="mb-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-4 py-2 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-in">
          <span class="text-base">⚠</span>
          <span>Wrong key — keep trying. Strict mode blocks you until the correct character is pressed.</span>
        </div>
      }

      <div class="card overflow-hidden"
           [class.shake]="wrongFlash()">
        <div class="h-1 bg-slate-100 dark:bg-slate-800">
          <div class="h-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-150" [style.width.%]="progress()"></div>
        </div>

        <div class="relative">
          <div #pad class="px-6 py-8 text-xl sm:text-2xl leading-relaxed font-mono select-none cursor-text outline-none"
               tabindex="0"
               (click)="focusInput()"
               (focus)="hasFocus.set(true)"
               (blur)="hasFocus.set(false)"
               aria-label="Typing area — start typing">
            @for (c of chars(); track $index; let i = $index) {
              <span
                class="char relative"
                [class.is-correct]="state()[i] === 1"
                [class.is-wrong]="state()[i] === 2"
                [class.is-current]="i === pos()"
                [class.is-flash]="i === pos() && wrongFlash()"
                [class.is-untyped]="state()[i] === 0 && i !== pos()">{{ c }}</span>
            }
          </div>

          @if (!started() && !finished()) {
            <div class="absolute inset-0 grid place-items-center bg-white/70 dark:bg-slate-900/60 backdrop-blur-[2px] pointer-events-none">
              <div class="text-center">
                <div class="text-2xl mb-1">⌨</div>
                <div class="text-sm font-semibold">{{ hasFocus() ? 'Start typing to begin' : 'Click here, then start typing' }}</div>
                <div class="text-xs text-slate-500 mt-1">Esc to reset · Tab + Enter for a fresh text</div>
              </div>
            </div>
          }
        </div>
      </div>

      @if (finished()) {
        <div class="card p-6 mt-4 bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-950/40 dark:to-indigo-950/40 border-brand-200 dark:border-brand-900/50">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 grid place-items-center text-white text-2xl">🏁</div>
            <div>
              <div class="font-display text-xl font-bold">{{ rating() }}</div>
              <div class="text-sm text-slate-500">{{ levelLabel() }} · {{ wpm() }} WPM · {{ accuracy() }}% accuracy</div>
            </div>
            <span class="flex-1"></span>
            <button class="btn-secondary text-sm" (click)="reset(true)">New text</button>
            <button class="btn-primary text-sm" (click)="reset()">Try again</button>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><div class="text-slate-500 text-xs">Words typed</div><div class="font-semibold">{{ wordsTyped() }}</div></div>
            <div><div class="text-slate-500 text-xs">Characters</div><div class="font-semibold">{{ pos() }} / {{ chars().length }}</div></div>
            <div><div class="text-slate-500 text-xs">Errors</div><div class="font-semibold">{{ errors() }}</div></div>
            <div><div class="text-slate-500 text-xs">Time</div><div class="font-semibold">{{ timeDisplay() }}</div></div>
          </div>
        </div>
      }

      <p class="mt-4 text-xs text-slate-500 text-center">Click the text area or press any key to focus · Backspace to fix typos · Esc to reset</p>
    </section>
  `,
  styles: [`
    .char {
      display: inline-block;
      padding: 0 1px;
      border-radius: 4px;
      transition: background-color 0.1s, color 0.1s;
      white-space: pre;
    }
    .is-untyped { color: rgb(100 116 139); }
    :host-context(.dark) .is-untyped { color: rgb(148 163 184); }
    .is-correct { background-color: rgba(16, 185, 129, 0.18); color: rgb(15, 23, 42); }
    :host-context(.dark) .is-correct { color: rgb(226, 232, 240); }
    .is-wrong { background-color: rgba(244, 63, 94, 0.28); color: rgb(190, 18, 60); }
    :host-context(.dark) .is-wrong { color: rgb(253, 164, 175); }
    .is-current::after {
      content: '';
      position: absolute;
      left: 1px; right: 1px; bottom: -2px;
      height: 2px;
      background: rgb(99, 102, 241);
      animation: blink 1s steps(2, start) infinite;
      border-radius: 2px;
    }
    .is-flash {
      background-color: rgba(244, 63, 94, 0.45) !important;
      color: rgb(159, 18, 57) !important;
      animation: pop 0.32s ease;
    }
    :host-context(.dark) .is-flash {
      color: rgb(253, 164, 175) !important;
    }
    .shake { animation: shake 0.32s ease; }
    @keyframes blink {
      to { background: transparent; }
    }
    @keyframes pop {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.25); }
      60%  { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(6px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(3px); }
    }
    .animate-in {
      animation: fade-in 0.2s ease;
    }
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-2px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class TypingTest implements OnDestroy {
  @ViewChild('pad') padRef?: ElementRef<HTMLDivElement>;

  protected levels: { id: Level; label: string }[] = [
    { id: 'easy', label: 'Easy' },
    { id: 'medium', label: 'Medium' },
    { id: 'hard', label: 'Hard' },
  ];
  protected durations: { id: Duration; label: string }[] = [
    { id: 15, label: '15s' },
    { id: 30, label: '30s' },
    { id: 60, label: '1 min' },
    { id: 120, label: '2 min' },
    { id: 0, label: 'No limit' },
  ];

  protected level = signal<Level>('medium');
  protected duration = signal<Duration>(60);
  protected hasFocus = signal(false);
  protected strict = signal(true);
  protected wrongFlash = signal(false);
  protected attempts = signal(0);
  private flashTimer: any = null;

  protected text = signal('');
  protected chars = computed(() => this.text().split(''));
  protected pos = signal(0);
  protected state = signal<Uint8Array>(new Uint8Array(0)); // 0=untyped, 1=correct, 2=wrong
  protected errors = signal(0);
  protected started = signal(false);
  protected finished = signal(false);
  protected startMs = signal(0);
  protected elapsedMs = signal(0);

  protected progress = computed(() => {
    const total = this.chars().length;
    return total ? Math.min(100, (this.pos() / total) * 100) : 0;
  });

  protected wpm = computed(() => {
    const minutes = this.elapsedMs() / 60000;
    if (minutes <= 0) return 0;
    const correctChars = this.state().reduce((s, v) => s + (v === 1 ? 1 : 0), 0);
    return Math.round((correctChars / 5) / minutes);
  });

  protected accuracy = computed(() => {
    const a = this.attempts();
    if (!a) return 100;
    return Math.max(0, Math.round(((a - this.errors()) / a) * 100));
  });

  protected timeDisplay = computed(() => {
    const d = this.duration();
    if (!this.started() && d) return d + 's';
    if (d) {
      const remaining = Math.max(0, d - Math.floor(this.elapsedMs() / 1000));
      return remaining + 's';
    }
    return Math.floor(this.elapsedMs() / 1000) + 's';
  });

  protected wordsTyped = computed(() => {
    const typed = this.text().slice(0, this.pos());
    return typed.split(/\s+/).filter(Boolean).length;
  });

  protected rating = computed(() => {
    const wpm = this.wpm(), acc = this.accuracy();
    if (acc < 80) return 'Keep practicing — accuracy matters first';
    if (wpm >= 80) return '🚀 Pro typist!';
    if (wpm >= 60) return '🔥 Excellent speed';
    if (wpm >= 40) return '✨ Solid pace';
    if (wpm >= 20) return '👍 Good — getting there';
    return 'Nice start!';
  });

  protected levelLabel = computed(() => this.levels.find(l => l.id === this.level())!.label);

  private tickHandle: any = null;

  constructor() {
    this.pickText();
  }

  ngOnDestroy() {
    if (this.tickHandle) clearInterval(this.tickHandle);
    if (this.flashTimer) clearTimeout(this.flashTimer);
  }

  setLevel(l: Level) {
    if (this.level() === l) return;
    this.level.set(l);
    this.reset(true);
  }

  setDuration(d: Duration) {
    if (this.duration() === d) return;
    this.duration.set(d);
    this.reset();
  }

  private pickText() {
    const pool = TEXTS[this.level()];
    const t = pool[Math.floor(Math.random() * pool.length)];
    this.text.set(t);
    this.state.set(new Uint8Array(t.length));
  }

  focusInput() {
    this.padRef?.nativeElement.focus();
  }

  reset(newText = false) {
    if (this.tickHandle) { clearInterval(this.tickHandle); this.tickHandle = null; }
    if (this.flashTimer) { clearTimeout(this.flashTimer); this.flashTimer = null; }
    this.pos.set(0);
    this.errors.set(0);
    this.attempts.set(0);
    this.started.set(false);
    this.finished.set(false);
    this.startMs.set(0);
    this.elapsedMs.set(0);
    this.wrongFlash.set(false);
    if (newText) this.pickText();
    else this.state.set(new Uint8Array(this.text().length));
    setTimeout(() => this.focusInput(), 0);
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.reset();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      this.reset(true);
      return;
    }
    if (!this.hasFocus()) return;
    if (this.finished()) return;

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'Backspace') {
      e.preventDefault();
      this.backspace();
      return;
    }

    if (e.key.length !== 1) return;

    e.preventDefault();
    this.handleChar(e.key);
  }

  private handleChar(ch: string) {
    if (!this.started()) this.start();

    const i = this.pos();
    const target = this.text()[i];
    if (target == null) return;

    this.attempts.update(n => n + 1);

    if (ch === target) {
      const next = new Uint8Array(this.state());
      next[i] = 1;
      this.state.set(next);
      this.pos.set(i + 1);
      this.wrongFlash.set(false);
      if (i + 1 >= this.text().length) this.finish();
      return;
    }

    this.errors.update(n => n + 1);

    if (this.strict()) {
      this.triggerWrongFlash();
    } else {
      const next = new Uint8Array(this.state());
      next[i] = 2;
      this.state.set(next);
      this.pos.set(i + 1);
      if (i + 1 >= this.text().length) this.finish();
    }
  }

  private triggerWrongFlash() {
    this.wrongFlash.set(true);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.wrongFlash.set(false), 320);
  }

  private backspace() {
    const i = this.pos();
    if (i <= 0) return;
    const next = new Uint8Array(this.state());
    next[i - 1] = 0;
    this.state.set(next);
    this.pos.set(i - 1);
  }

  private start() {
    this.started.set(true);
    this.startMs.set(performance.now());
    this.tickHandle = setInterval(() => {
      const e = performance.now() - this.startMs();
      this.elapsedMs.set(e);
      const d = this.duration();
      if (d && e / 1000 >= d) this.finish();
    }, 100);
  }

  private finish() {
    if (this.tickHandle) { clearInterval(this.tickHandle); this.tickHandle = null; }
    this.finished.set(true);
  }
}
