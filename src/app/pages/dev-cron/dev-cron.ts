import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-cron',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Cron Builder" subtitle="Visualise a cron expression — pick fields, see human description and next 5 runs." icon="⏱" color="from-violet-500 to-purple-600" back="/dev" backLabel="Developer tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">

      <div class="card p-5 space-y-3">
        <label class="text-sm font-medium">Cron expression</label>
        <div class="grid grid-cols-5 gap-2">
          <input class="input font-mono text-center" [(ngModel)]="m" (ngModelChange)="run()" placeholder="*" />
          <input class="input font-mono text-center" [(ngModel)]="h" (ngModelChange)="run()" placeholder="*" />
          <input class="input font-mono text-center" [(ngModel)]="dom" (ngModelChange)="run()" placeholder="*" />
          <input class="input font-mono text-center" [(ngModel)]="mon" (ngModelChange)="run()" placeholder="*" />
          <input class="input font-mono text-center" [(ngModel)]="dow" (ngModelChange)="run()" placeholder="*" />
        </div>
        <div class="grid grid-cols-5 gap-2 text-[10px] text-slate-500 text-center font-medium">
          <div>Minute<br><span class="text-[9px]">0-59</span></div>
          <div>Hour<br><span class="text-[9px]">0-23</span></div>
          <div>Day<br><span class="text-[9px]">1-31</span></div>
          <div>Month<br><span class="text-[9px]">1-12</span></div>
          <div>Weekday<br><span class="text-[9px]">0-6 (Sun-Sat)</span></div>
        </div>

        <div class="flex flex-wrap gap-1 pt-1">
          @for (p of presets; track p.label) {
            <button class="btn-ghost text-xs" (click)="load(p)">{{ p.label }}</button>
          }
        </div>

        <div class="font-mono text-base bg-slate-900 text-emerald-400 rounded-lg px-3 py-2 text-center">{{ expression() }}</div>
      </div>

      <div class="card p-5">
        <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Description</div>
        <div class="text-lg font-display font-semibold">{{ describe() }}</div>
      </div>

      <div class="card p-5">
        <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Next 5 runs</div>
        @if (error()) {
          <div class="text-sm text-rose-600">⚠ {{ error() }}</div>
        } @else {
          <ul class="space-y-1.5">
            @for (n of next(); track $index) {
              <li class="flex justify-between text-sm font-mono">
                <span class="text-slate-500">#{{ $index + 1 }}</span>
                <span>{{ n }}</span>
              </li>
            }
          </ul>
        }
      </div>
    </section>
  `,
})
export class DevCron {
  protected m = '0'; protected h = '9'; protected dom = '*'; protected mon = '*'; protected dow = '1-5';
  protected error = signal('');

  protected presets = [
    { label: 'Every minute', v: '* * * * *' },
    { label: 'Every hour',   v: '0 * * * *' },
    { label: 'Every day 9am', v: '0 9 * * *' },
    { label: 'Weekdays 9am',  v: '0 9 * * 1-5' },
    { label: 'Mon-Fri every 15m', v: '*/15 * * * 1-5' },
    { label: 'Monthly 1st',   v: '0 0 1 * *' },
    { label: 'Yearly Jan 1',  v: '0 0 1 1 *' },
  ];

  protected expression = computed(() => `${this.m} ${this.h} ${this.dom} ${this.mon} ${this.dow}`);

  protected describe = signal('');
  protected next = signal<string[]>([]);

  constructor() { this.run(); }

  load(p: { v: string }) {
    const parts = p.v.split(/\s+/);
    [this.m, this.h, this.dom, this.mon, this.dow] = parts;
    this.run();
  }

  run() {
    try {
      this.describe.set(this.toHuman());
      this.next.set(this.computeNext(5));
      this.error.set('');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Invalid expression');
      this.next.set([]);
    }
  }

  private toHuman(): string {
    const m = this.m, h = this.h, dom = this.dom, mon = this.mon, dow = this.dow;
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const everyMinute = m === '*';
    const everyHour = h === '*';
    const everyDom = dom === '*';
    const everyMon = mon === '*';
    const everyDow = dow === '*';

    let parts: string[] = [];

    if (m.startsWith('*/')) parts.push(`every ${m.slice(2)} minutes`);
    else if (everyMinute && everyHour) parts.push('every minute');
    else if (!everyMinute && !everyHour) parts.push(`at ${h.padStart(2, '0')}:${m.padStart(2, '0')}`);
    else if (everyMinute) parts.push(`every minute past hour ${h}`);
    else parts.push(`at minute ${m}`);

    if (!everyDow) {
      const range = dow.split(',').map(s => {
        const r = s.match(/^(\d)-(\d)$/);
        if (r) return `${days[+r[1] % 7]}-${days[+r[2] % 7]}`;
        return days[+s % 7] ?? s;
      }).join(', ');
      parts.push(`on ${range}`);
    }
    if (!everyDom) parts.push(`on day ${dom}`);
    if (!everyMon) {
      const ms = mon.split(',').map(s => months[+s - 1] ?? s).join(', ');
      parts.push(`in ${ms}`);
    }
    return parts.join(' ');
  }

  private computeNext(count: number): string[] {
    const fields = [
      { val: this.m, min: 0, max: 59 },
      { val: this.h, min: 0, max: 23 },
      { val: this.dom, min: 1, max: 31 },
      { val: this.mon, min: 1, max: 12 },
      { val: this.dow, min: 0, max: 6 },
    ];
    const sets = fields.map(f => this.expand(f.val, f.min, f.max));
    const out: string[] = [];
    const start = new Date();
    start.setSeconds(0, 0);
    start.setMinutes(start.getMinutes() + 1);

    let d = new Date(start);
    let safety = 100_000;
    while (out.length < count && safety-- > 0) {
      if (
        sets[0].has(d.getMinutes()) &&
        sets[1].has(d.getHours()) &&
        sets[2].has(d.getDate()) &&
        sets[3].has(d.getMonth() + 1) &&
        sets[4].has(d.getDay())
      ) {
        out.push(d.toLocaleString());
      }
      d = new Date(d.getTime() + 60_000);
    }
    return out;
  }

  private expand(field: string, min: number, max: number): Set<number> {
    const result = new Set<number>();
    for (const part of field.split(',')) {
      const m = part.match(/^\*(\/(\d+))?$/);
      if (m) {
        const step = m[2] ? +m[2] : 1;
        for (let i = min; i <= max; i += step) result.add(i);
        continue;
      }
      const r = part.match(/^(\d+)-(\d+)(\/(\d+))?$/);
      if (r) {
        const a = +r[1], b = +r[2], step = r[4] ? +r[4] : 1;
        for (let i = a; i <= b; i += step) result.add(i);
        continue;
      }
      if (/^\d+$/.test(part)) result.add(+part);
      else throw new Error('Invalid field: ' + field);
    }
    return result;
  }
}
