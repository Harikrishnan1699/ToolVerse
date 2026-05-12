import { Component, computed, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  log: Record<string, boolean>;
}

const KEY = 'tv.habitTracker.v1';
const COLORS = ['emerald', 'sky', 'violet', 'rose', 'amber', 'cyan', 'lime', 'fuchsia'];
const EMOJIS = ['💧', '📖', '🏃', '🧘', '🥗', '😴', '✍️', '🎯', '☕', '🚭', '💪', '🎵'];

@Component({
  selector: 'app-habit-tracker',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Habit Tracker" subtitle="Build streaks. 100% local — your data never leaves the browser." icon="🎯" color="from-emerald-500 to-teal-600" back="/" backLabel="Home" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">

      <div class="card p-4 flex flex-wrap gap-2 items-center">
        <input class="input flex-1 min-w-[180px]" placeholder="New habit (e.g. Drink water)" [(ngModel)]="newName" (keydown.enter)="add()" />
        <select class="input w-20" [(ngModel)]="newEmoji">
          @for (e of EMOJIS; track e) { <option [value]="e">{{ e }}</option> }
        </select>
        <button class="btn-primary" (click)="add()" [disabled]="!newName.trim()">Add habit</button>
        <span class="flex-1"></span>
        <div class="text-xs text-slate-500">{{ habits().length }} habit(s) · {{ totalStreak() }} day total streak</div>
      </div>

      @if (habits().length === 0) {
        <div class="card p-12 text-center">
          <div class="text-6xl mb-3">🌱</div>
          <h3 class="font-display text-xl font-bold">Plant your first habit</h3>
          <p class="text-sm text-slate-500 mt-1">Small daily actions, big results. Add a habit above to begin.</p>
        </div>
      }

      @for (h of habits(); track h.id) {
        <div class="card p-4">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-2xl">{{ h.emoji }}</span>
            <div class="flex-1">
              <input class="bg-transparent font-semibold outline-none w-full" [ngModel]="h.name" (ngModelChange)="rename(h.id, $event)" />
              <div class="text-xs text-slate-500">
                Current streak <strong class="text-emerald-600 dark:text-emerald-400">{{ streak(h) }}</strong> · best {{ bestStreak(h) }} · {{ totalDays(h) }} total days
              </div>
            </div>
            <button class="btn-ghost text-xs text-rose-500" (click)="remove(h.id)" title="Delete habit">🗑</button>
          </div>

          <div class="grid grid-cols-7 sm:grid-cols-14 gap-1">
            @for (d of last30(); track d.iso) {
              <button
                class="aspect-square rounded-lg text-[10px] font-medium border transition flex flex-col items-center justify-center"
                [class.bg-emerald-500]="h.log[d.iso]"
                [class.text-white]="h.log[d.iso]"
                [class.border-emerald-500]="h.log[d.iso]"
                [class.bg-slate-50]="!h.log[d.iso]"
                [class.dark:bg-slate-800]="!h.log[d.iso]"
                [class.border-slate-200]="!h.log[d.iso] && !d.isToday"
                [class.dark:border-slate-700]="!h.log[d.iso] && !d.isToday"
                [class.!border-brand-500]="d.isToday"
                [class.ring-2]="d.isToday"
                [class.ring-brand-300]="d.isToday"
                (click)="toggle(h.id, d.iso)"
                [title]="d.label">
                <span class="opacity-70">{{ d.dom }}</span>
              </button>
            }
          </div>
          <div class="text-[10px] text-slate-400 mt-2 flex justify-between">
            <span>{{ last30()[0].label }}</span>
            <span>today</span>
          </div>
        </div>
      }

      <div class="card p-4 text-xs text-slate-500">
        Data is stored in your browser only (localStorage). Clear browser data and your habits vanish — no cloud, no account, no tracking.
      </div>
    </section>
  `,
})
export class HabitTracker {
  protected readonly EMOJIS = EMOJIS;
  protected habits = signal<Habit[]>([]);
  protected newName = '';
  protected newEmoji = '🎯';

  constructor(private toast: ToastService) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) this.habits.set(JSON.parse(raw));
    } catch {}
    effect(() => {
      try { localStorage.setItem(KEY, JSON.stringify(this.habits())); } catch {}
    });
  }

  protected last30 = computed(() => {
    const out: { iso: string; dom: number; label: string; isToday: boolean }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayIso = this.toIso(today);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      out.push({
        iso: this.toIso(d),
        dom: d.getDate(),
        label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: this.toIso(d) === todayIso,
      });
    }
    return out;
  });

  protected totalStreak = computed(() => this.habits().reduce((s, h) => s + this.streak(h), 0));

  add() {
    const name = this.newName.trim();
    if (!name) return;
    const used = new Set(this.habits().map(h => h.color));
    const color = COLORS.find(c => !used.has(c)) ?? COLORS[this.habits().length % COLORS.length];
    this.habits.set([...this.habits(), { id: crypto.randomUUID(), name, emoji: this.newEmoji, color, log: {} }]);
    this.newName = '';
    this.toast.success('Habit added');
  }

  remove(id: string) {
    if (!confirm('Delete this habit and its history?')) return;
    this.habits.set(this.habits().filter(h => h.id !== id));
  }

  rename(id: string, name: string) {
    this.habits.set(this.habits().map(h => h.id === id ? { ...h, name } : h));
  }

  toggle(id: string, iso: string) {
    this.habits.set(this.habits().map(h => {
      if (h.id !== id) return h;
      const log = { ...h.log };
      if (log[iso]) delete log[iso]; else log[iso] = true;
      return { ...h, log };
    }));
  }

  streak(h: Habit): number {
    let n = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 3650; i++) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      if (h.log[this.toIso(d)]) n++;
      else if (i === 0) continue;
      else break;
    }
    return n;
  }

  bestStreak(h: Habit): number {
    const days = Object.keys(h.log).filter(k => h.log[k]).sort();
    if (!days.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]); const here = new Date(days[i]);
      const diff = Math.round((+here - +prev) / 86400000);
      if (diff === 1) { cur++; best = Math.max(best, cur); }
      else cur = 1;
    }
    return best;
  }

  totalDays(h: Habit): number {
    return Object.values(h.log).filter(Boolean).length;
  }

  private toIso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
