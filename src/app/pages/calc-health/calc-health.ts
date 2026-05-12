import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SectionHeader } from '../../shared/section-header/section-header';

type Tab = 'sleep' | 'calorie' | 'water' | 'pace';

@Component({
  selector: 'app-calc-health',
  imports: [FormsModule, CommonModule, SectionHeader],
  template: `
    <app-section-header title="Health Calculators" subtitle="Sleep cycles, calorie / macro, water intake, pace." icon="❤" color="from-pink-500 to-rose-600" back="/" backLabel="Home" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">
      <div class="card p-2 flex flex-wrap gap-1">
        @for (t of tabs; track t.id) {
          <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
        }
      </div>

      @switch (tab()) {

        @case ('sleep') {
          <div class="card p-6 space-y-4 max-w-md mx-auto">
            <div>
              <label class="text-sm">I want to wake up at</label>
              <input type="time" class="input mt-1" [(ngModel)]="wakeAt" />
            </div>
            <div class="text-sm text-slate-500">Sleep in 90-minute cycles. Hit snooze and you'll feel groggy — wake at the end of a cycle.</div>
            <div class="space-y-2">
              @for (c of sleepCycles(); track c.cycles) {
                <div class="card p-3 flex items-center justify-between">
                  <div>
                    <div class="font-display font-bold text-xl tabular-nums">{{ c.time }}</div>
                    <div class="text-xs text-slate-500">{{ c.cycles }} sleep cycles · {{ c.hours }}h sleep</div>
                  </div>
                  <span class="chip" [class.bg-emerald-100]="c.cycles >= 5" [class.text-emerald-700]="c.cycles >= 5" [class.bg-amber-100]="c.cycles < 5" [class.text-amber-700]="c.cycles < 5">
                    {{ c.cycles >= 5 ? 'Recommended' : 'Short rest' }}
                  </span>
                </div>
              }
            </div>
          </div>
        }

        @case ('calorie') {
          <div class="card p-6 space-y-4 max-w-2xl mx-auto">
            <div class="grid sm:grid-cols-3 gap-3">
              <div><label class="text-sm">Age</label><input type="number" class="input mt-1" [(ngModel)]="age" /></div>
              <div><label class="text-sm">Sex</label>
                <select class="input mt-1" [(ngModel)]="sex">
                  <option value="m">Male</option><option value="f">Female</option>
                </select>
              </div>
              <div><label class="text-sm">Weight (kg)</label><input type="number" class="input mt-1" [(ngModel)]="kg" /></div>
              <div><label class="text-sm">Height (cm)</label><input type="number" class="input mt-1" [(ngModel)]="cm" /></div>
              <div class="sm:col-span-2"><label class="text-sm">Activity level</label>
                <select class="input mt-1" [(ngModel)]="activity">
                  <option [ngValue]="1.2">Sedentary (desk job)</option>
                  <option [ngValue]="1.375">Light (1-3x/wk)</option>
                  <option [ngValue]="1.55">Moderate (3-5x/wk)</option>
                  <option [ngValue]="1.725">Active (6-7x/wk)</option>
                  <option [ngValue]="1.9">Very active (manual + training)</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="card p-4 text-center"><div class="text-xs text-slate-500">BMR</div><div class="text-xl font-bold mt-1">{{ macros().bmr | number:'1.0-0' }}</div></div>
              <div class="card p-4 text-center"><div class="text-xs text-slate-500">Maintain</div><div class="text-xl font-bold mt-1">{{ macros().maintain | number:'1.0-0' }} kcal</div></div>
              <div class="card p-4 text-center bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900"><div class="text-xs text-rose-700 dark:text-rose-300">Lose 0.5 kg/wk</div><div class="text-xl font-bold mt-1 text-rose-700 dark:text-rose-300">{{ macros().lose | number:'1.0-0' }} kcal</div></div>
              <div class="card p-4 text-center bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"><div class="text-xs text-emerald-700 dark:text-emerald-300">Gain 0.5 kg/wk</div><div class="text-xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">{{ macros().gain | number:'1.0-0' }} kcal</div></div>
            </div>

            <div class="card p-4">
              <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Macros at maintenance</div>
              <div class="grid grid-cols-3 gap-3">
                <div><div class="text-xs">Protein</div><div class="font-bold">{{ macros().protein | number:'1.0-0' }} g</div></div>
                <div><div class="text-xs">Carbs</div><div class="font-bold">{{ macros().carbs | number:'1.0-0' }} g</div></div>
                <div><div class="text-xs">Fat</div><div class="font-bold">{{ macros().fat | number:'1.0-0' }} g</div></div>
              </div>
            </div>
          </div>
        }

        @case ('water') {
          <div class="card p-6 space-y-4 max-w-md mx-auto">
            <div><label class="text-sm">Weight (kg)</label><input type="number" class="input mt-1" [(ngModel)]="kg" /></div>
            <div><label class="text-sm">Exercise (mins/day)</label><input type="number" class="input mt-1" [(ngModel)]="exerciseMin" /></div>
            <div class="card p-5 bg-gradient-to-br from-sky-500 to-cyan-600 text-white text-center">
              <div class="text-sm opacity-80">Daily water target</div>
              <div class="text-5xl font-display font-bold mt-2">{{ water() }} L</div>
              <div class="text-xs mt-2 opacity-80">≈ {{ glasses() }} glasses of 250 ml</div>
            </div>
          </div>
        }

        @case ('pace') {
          <div class="card p-6 space-y-4 max-w-md mx-auto">
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-sm">Distance (km)</label><input type="number" step="0.1" class="input mt-1" [(ngModel)]="distance" /></div>
              <div><label class="text-sm">Time (min)</label><input type="number" class="input mt-1" [(ngModel)]="durationMin" /></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="card p-4 text-center"><div class="text-xs text-slate-500">Pace</div><div class="text-xl font-bold mt-1">{{ pace().pace }}</div></div>
              <div class="card p-4 text-center"><div class="text-xs text-slate-500">Speed</div><div class="text-xl font-bold mt-1">{{ pace().speed | number:'1.1-2' }} km/h</div></div>
            </div>
          </div>
        }
      }
    </section>
  `,
})
export class CalcHealth {
  protected tab = signal<Tab>('sleep');
  protected tabs: { id: Tab; label: string }[] = [
    { id: 'sleep', label: '🛌 Sleep' },
    { id: 'calorie', label: '🔥 Calorie & macros' },
    { id: 'water', label: '💧 Water' },
    { id: 'pace', label: '🏃 Running pace' },
  ];

  protected wakeAt = '07:00';

  protected sleepCycles = computed(() => {
    const [h, m] = this.wakeAt.split(':').map(Number);
    const wake = new Date(); wake.setHours(h, m, 0, 0);
    if (wake < new Date()) wake.setDate(wake.getDate() + 1);
    const items: { cycles: number; hours: string; time: string }[] = [];
    for (let cycles = 3; cycles <= 6; cycles++) {
      const minutes = cycles * 90 + 14; // +14 min to fall asleep
      const bed = new Date(wake.getTime() - minutes * 60_000);
      items.push({
        cycles,
        hours: (minutes / 60).toFixed(1),
        time: bed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
      });
    }
    return items;
  });

  protected age = 30; protected sex: 'm' | 'f' = 'm';
  protected kg = 70; protected cm = 175; protected activity = 1.55;

  protected macros = computed(() => {
    const bmr = this.sex === 'm'
      ? 10 * +this.kg + 6.25 * +this.cm - 5 * +this.age + 5
      : 10 * +this.kg + 6.25 * +this.cm - 5 * +this.age - 161;
    const maintain = bmr * +this.activity;
    return {
      bmr,
      maintain,
      lose: maintain - 500,
      gain: maintain + 500,
      protein: +this.kg * 1.6,
      carbs: (maintain * 0.45) / 4,
      fat: (maintain * 0.30) / 9,
    };
  });

  protected exerciseMin = 30;
  protected water = computed(() => {
    const base = +this.kg * 0.033;
    const bonus = (+this.exerciseMin / 30) * 0.35;
    return (base + bonus).toFixed(1);
  });
  protected glasses = computed(() => Math.round(parseFloat(this.water()) * 4));

  protected distance = 5; protected durationMin = 30;
  protected pace = computed(() => {
    const km = +this.distance || 0; const mins = +this.durationMin || 0;
    if (!km || !mins) return { pace: '-', speed: 0 };
    const pmin = mins / km;
    const m = Math.floor(pmin);
    const s = Math.round((pmin - m) * 60);
    return { pace: `${m}'${s.toString().padStart(2, '0')}" /km`, speed: km / (mins / 60) };
  });
}
