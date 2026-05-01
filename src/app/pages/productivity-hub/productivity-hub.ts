import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { WakeLockService } from '../../shared/wake-lock.service';
import { NotifyService } from '../../shared/notify.service';
import { BadgeService } from '../../shared/badge.service';

type Tab = 'pomodoro' | 'stopwatch' | 'timer' | 'todo' | 'notes' | 'random';

@Component({
  selector: 'app-productivity-hub',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Productivity Hub" subtitle="Pomodoro, stopwatch, countdown, todo list, scratchpad and random pickers." icon="⏱" color="from-rose-500 to-orange-500" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-2 flex flex-wrap gap-1">
        @for (t of tabs; track t.id) { <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button> }
      </div>

      @switch (tab()) {
        @case ('pomodoro') {
          <div class="card p-8 max-w-md mx-auto text-center space-y-4">
            <div class="text-sm font-semibold text-slate-500 uppercase tracking-widest">{{ pomoMode === 'work' ? '🎯 Focus' : '☕ Break' }}</div>
            <div class="text-7xl font-display font-bold tabular-nums">{{ fmt(pomoLeft()) }}</div>
            <div class="flex justify-center gap-2">
              @if (!pomoRunning()) {
                <button class="btn-primary" (click)="pomoStart()">Start</button>
              } @else {
                <button class="btn-secondary" (click)="pomoStop()">Pause</button>
              }
              <button class="btn-ghost" (click)="pomoReset()">Reset</button>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div><label>Work (min)</label><input type="number" class="input mt-1" [(ngModel)]="pomoWork" (ngModelChange)="pomoReset()" /></div>
              <div><label>Break (min)</label><input type="number" class="input mt-1" [(ngModel)]="pomoBreak" (ngModelChange)="pomoReset()" /></div>
            </div>
            <div class="text-xs text-slate-500">Cycles completed: {{ pomoCycles() }}</div>
          </div>
        }
        @case ('stopwatch') {
          <div class="card p-8 max-w-md mx-auto text-center space-y-4">
            <div class="text-7xl font-display font-bold tabular-nums">{{ fmtMs(swElapsed()) }}</div>
            <div class="flex justify-center gap-2">
              @if (!swRunning()) { <button class="btn-primary" (click)="swStart()">Start</button> }
              @else { <button class="btn-secondary" (click)="swStop()">Pause</button> }
              <button class="btn-ghost" (click)="swLap()">Lap</button>
              <button class="btn-ghost" (click)="swReset()">Reset</button>
            </div>
            @if (swLaps().length) {
              <div class="text-left max-h-48 overflow-auto">
                @for (l of swLaps(); track $index; let i = $index) {
                  <div class="flex justify-between text-sm py-1 border-b border-slate-100 dark:border-slate-800">
                    <span class="text-slate-500">Lap {{ swLaps().length - i }}</span>
                    <span class="font-mono">{{ fmtMs(l) }}</span>
                  </div>
                }
              </div>
            }
          </div>
        }
        @case ('timer') {
          <div class="card p-8 max-w-md mx-auto text-center space-y-4">
            <div class="text-7xl font-display font-bold tabular-nums">{{ fmt(tmLeft()) }}</div>
            <div class="grid grid-cols-3 gap-2">
              <input type="number" class="input text-center" [(ngModel)]="tmH" placeholder="H" />
              <input type="number" class="input text-center" [(ngModel)]="tmM" placeholder="M" />
              <input type="number" class="input text-center" [(ngModel)]="tmS" placeholder="S" />
            </div>
            <div class="flex justify-center gap-2">
              @if (!tmRunning()) { <button class="btn-primary" (click)="tmStart()">Start</button> }
              @else { <button class="btn-secondary" (click)="tmStop()">Pause</button> }
              <button class="btn-ghost" (click)="tmReset()">Reset</button>
            </div>
          </div>
        }
        @case ('todo') {
          <div class="card p-6 space-y-3 max-w-2xl mx-auto">
            <div class="flex gap-2">
              <input class="input" placeholder="Add a task…" [(ngModel)]="newTask" (keydown.enter)="addTask()" />
              <button class="btn-primary" (click)="addTask()">Add</button>
            </div>
            <ul class="space-y-1.5">
              @for (t of todos(); track $index; let i = $index) {
                <li class="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <input type="checkbox" [(ngModel)]="t.done" (change)="saveTodos()" />
                  <span class="flex-1" [class.line-through]="t.done" [class.text-slate-400]="t.done">{{ t.text }}</span>
                  <button class="btn-ghost text-xs text-rose-600" (click)="removeTask(i)">×</button>
                </li>
              }
            </ul>
            @if (todos().length) {
              <div class="text-xs text-slate-500">
                {{ todoDone() }} of {{ todos().length }} done · stored locally
                <button class="btn-ghost text-xs ml-2" (click)="clearDone()">Clear done</button>
              </div>
            }
          </div>
        }
        @case ('notes') {
          <div class="card p-6 max-w-2xl mx-auto">
            <textarea class="input font-mono text-sm h-96" [(ngModel)]="notes" (ngModelChange)="saveNotes()" placeholder="Quick scratchpad — saved automatically."></textarea>
            <div class="text-xs text-slate-500 mt-2">{{ notes.length }} chars · stored locally</div>
          </div>
        }
        @case ('random') {
          <div class="grid sm:grid-cols-2 gap-5">
            <div class="card p-6 space-y-3">
              <div class="text-sm font-semibold">🎲 Dice roller</div>
              <div class="flex gap-2 items-end">
                <select class="input" [(ngModel)]="diceType">
                  <option value="6">d6</option><option value="8">d8</option><option value="10">d10</option><option value="12">d12</option><option value="20">d20</option><option value="100">d100</option>
                </select>
                <input type="number" min="1" max="10" class="input" [(ngModel)]="diceCount" />
                <button class="btn-primary" (click)="rollDice()">Roll</button>
              </div>
              <div class="text-3xl font-display font-bold">{{ diceResult() }}</div>
            </div>
            <div class="card p-6 space-y-3">
              <div class="text-sm font-semibold">🪙 Coin flip</div>
              <button class="btn-primary w-full" (click)="flipCoin()">Flip</button>
              <div class="text-3xl font-display font-bold text-center">{{ coinResult() }}</div>
            </div>
            <div class="card p-6 space-y-3">
              <div class="text-sm font-semibold"># Random number</div>
              <div class="grid grid-cols-2 gap-2">
                <input type="number" class="input" [(ngModel)]="rnMin" placeholder="Min" />
                <input type="number" class="input" [(ngModel)]="rnMax" placeholder="Max" />
              </div>
              <button class="btn-primary w-full" (click)="randomNum()">Generate</button>
              <div class="text-3xl font-display font-bold">{{ rnResult() }}</div>
            </div>
            <div class="card p-6 space-y-3">
              <div class="text-sm font-semibold">🎯 Random picker</div>
              <textarea class="input font-mono text-xs h-24" placeholder="One option per line" [(ngModel)]="pickerList"></textarea>
              <button class="btn-primary w-full" (click)="pickRandom()">Pick</button>
              <div class="text-2xl font-display font-bold">{{ pickerResult() }}</div>
            </div>
          </div>
        }
      }
    </section>
  `,
})
export class ProductivityHub implements OnInit, OnDestroy {
  protected tab = signal<Tab>('pomodoro');
  protected tabs: { id: Tab; label: string }[] = [
    { id: 'pomodoro', label: 'Pomodoro' }, { id: 'stopwatch', label: 'Stopwatch' }, { id: 'timer', label: 'Timer' },
    { id: 'todo', label: 'To-do' }, { id: 'notes', label: 'Notes' }, { id: 'random', label: 'Random' },
  ];

  // Pomodoro
  protected pomoMode: 'work' | 'break' = 'work';
  protected pomoWork = 25; protected pomoBreak = 5;
  protected pomoLeft = signal(25 * 60);
  protected pomoRunning = signal(false);
  protected pomoCycles = signal(0);
  private pomoTimer: any;
  pomoStart() {
    this.pomoRunning.set(true);
    this.wake.request();
    this.notify.ensurePermission();
    this.pomoTimer = setInterval(() => {
      if (this.pomoLeft() <= 0) {
        this.pomoCycles.update(n => n + 1);
        const wasWork = this.pomoMode === 'work';
        this.pomoMode = wasWork ? 'break' : 'work';
        this.pomoLeft.set((this.pomoMode === 'work' ? +this.pomoWork : +this.pomoBreak) * 60);
        this.notify.send(
          wasWork ? '☕ Break time!' : '🎯 Focus time!',
          wasWork ? `Take a ${this.pomoBreak}-minute break.` : `Start the next ${this.pomoWork}-minute focus block.`,
          { tag: 'pomodoro' }
        );
      } else this.pomoLeft.update(n => n - 1);
    }, 1000);
  }
  pomoStop() { clearInterval(this.pomoTimer); this.pomoRunning.set(false); this.wake.release(); }
  pomoReset() { this.pomoStop(); this.pomoMode = 'work'; this.pomoLeft.set(+this.pomoWork * 60); }

  // Stopwatch
  protected swElapsed = signal(0);
  protected swRunning = signal(false);
  protected swLaps = signal<number[]>([]);
  private swTimer: any; private swStartAt = 0; private swAccum = 0;
  swStart() { this.swStartAt = Date.now(); this.swRunning.set(true); this.wake.request(); this.swTimer = setInterval(() => this.swElapsed.set(this.swAccum + Date.now() - this.swStartAt), 31); }
  swStop() { clearInterval(this.swTimer); this.swAccum = this.swElapsed(); this.swRunning.set(false); this.wake.release(); }
  swLap() { this.swLaps.update(a => [this.swElapsed(), ...a]); }
  swReset() { this.swStop(); this.swElapsed.set(0); this.swAccum = 0; this.swLaps.set([]); }

  // Timer
  protected tmH = 0; protected tmM = 5; protected tmS = 0;
  protected tmLeft = signal(0); protected tmRunning = signal(false);
  private tmTimer: any;
  tmStart() {
    if (this.tmLeft() === 0) this.tmLeft.set(+this.tmH * 3600 + +this.tmM * 60 + +this.tmS);
    this.tmRunning.set(true);
    this.wake.request();
    this.notify.ensurePermission();
    this.tmTimer = setInterval(() => {
      if (this.tmLeft() <= 0) {
        this.tmStop();
        this.notify.send('⏰ Timer finished', 'Your countdown timer has hit zero.', { tag: 'timer' });
        return;
      }
      this.tmLeft.update(n => n - 1);
    }, 1000);
  }
  tmStop() { clearInterval(this.tmTimer); this.tmRunning.set(false); this.wake.release(); }
  tmReset() { this.tmStop(); this.tmLeft.set(0); }

  // Services
  private wake = inject(WakeLockService);
  private notify = inject(NotifyService);
  private badge = inject(BadgeService);

  // Todo
  protected newTask = '';
  protected todos = signal<{text: string; done: boolean}[]>([]);
  ngOnInit() {
    try { this.todos.set(JSON.parse(localStorage.getItem('tv.todos') ?? '[]')); } catch {}
    this.notes = localStorage.getItem('tv.notes') ?? '';
    this.refreshBadge();
  }
  addTask() { if (!this.newTask.trim()) return; this.todos.update(t => [...t, { text: this.newTask.trim(), done: false }]); this.newTask = ''; this.saveTodos(); }
  removeTask(i: number) { this.todos.update(t => t.filter((_, idx) => idx !== i)); this.saveTodos(); }
  clearDone() { this.todos.update(t => t.filter(x => !x.done)); this.saveTodos(); }
  saveTodos() {
    localStorage.setItem('tv.todos', JSON.stringify(this.todos()));
    this.refreshBadge();
  }
  todoDone() { return this.todos().filter(t => t.done).length; }
  private refreshBadge() {
    const open = this.todos().filter(t => !t.done).length;
    this.badge.set(open);
  }

  // Notes
  protected notes = '';
  saveNotes() { localStorage.setItem('tv.notes', this.notes); }

  // Random
  protected diceType = '6'; protected diceCount = 1; protected diceResult = signal(0);
  protected coinResult = signal(''); protected rnMin = 1; protected rnMax = 100; protected rnResult = signal(0);
  protected pickerList = ''; protected pickerResult = signal('');
  rollDice() { let s = 0; for (let i = 0; i < +this.diceCount; i++) s += Math.ceil(Math.random() * +this.diceType); this.diceResult.set(s); }
  flipCoin() { this.coinResult.set(Math.random() < 0.5 ? 'Heads' : 'Tails'); }
  randomNum() { const a = +this.rnMin, b = +this.rnMax; this.rnResult.set(Math.floor(a + Math.random() * (b - a + 1))); }
  pickRandom() { const items = this.pickerList.split('\n').filter(l => l.trim()); this.pickerResult.set(items.length ? items[Math.floor(Math.random() * items.length)] : ''); }

  fmt(s: number) { const m = Math.floor(s / 60), sec = s % 60; return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`; }
  fmtMs(ms: number) { const t = Math.floor(ms / 10); const cs = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000); return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`; }

  ngOnDestroy() { clearInterval(this.pomoTimer); clearInterval(this.swTimer); clearInterval(this.tmTimer); }
}
