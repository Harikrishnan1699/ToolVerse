import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

interface Zone { id: string; label: string; }

const POPULAR: Zone[] = [
  { id: 'Asia/Kolkata', label: 'Mumbai · Delhi · Bengaluru' },
  { id: 'America/New_York', label: 'New York · Toronto' },
  { id: 'America/Los_Angeles', label: 'Los Angeles · San Francisco' },
  { id: 'America/Chicago', label: 'Chicago' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Berlin', label: 'Berlin · Paris' },
  { id: 'Europe/Moscow', label: 'Moscow' },
  { id: 'Asia/Dubai', label: 'Dubai' },
  { id: 'Asia/Tokyo', label: 'Tokyo' },
  { id: 'Asia/Singapore', label: 'Singapore' },
  { id: 'Asia/Shanghai', label: 'Shanghai · Beijing' },
  { id: 'Australia/Sydney', label: 'Sydney' },
];

@Component({
  selector: 'app-timezone-converter',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Time Zone Converter" subtitle="Plan meetings across cities — slide the time bar to find overlap." icon="🌐" color="from-sky-500 to-indigo-600" back="/" backLabel="Home" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="card p-6 space-y-5">
        <div>
          <label class="text-sm font-medium">Reference time</label>
          <div class="flex flex-wrap gap-2 mt-2 items-center">
            <input type="datetime-local" class="input !w-auto" [(ngModel)]="iso" />
            <button class="btn-secondary text-xs" (click)="now()">Now</button>
            <select class="input !w-auto text-sm" [(ngModel)]="anchor">
              @for (z of zones(); track z.id) { <option [ngValue]="z.id">{{ z.label }} ({{ z.id }})</option> }
            </select>
            <span class="text-xs text-slate-500 ml-auto">Drag the slider in any row to shift all zones together</span>
          </div>
        </div>

        <div class="space-y-2">
          @for (z of zones(); track z.id; let i = $index) {
            <div class="card p-3 grid grid-cols-[170px_1fr_auto] gap-3 items-center">
              <div class="min-w-0">
                <div class="font-semibold text-sm truncate">{{ z.label }}</div>
                <div class="text-[10px] text-slate-500">{{ z.id }} · {{ offsetLabel(z.id) }}</div>
              </div>
              <div>
                <input type="range" min="0" max="1439" step="15" class="w-full accent-brand-500"
                       [value]="minutesInZone(z.id)" (input)="setFromSlider(z.id, $event)" />
                <div class="flex justify-between text-[9px] text-slate-400 mt-0.5">
                  <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-lg font-display font-bold tabular-nums">{{ timeStr(z.id) }}</div>
                <div class="text-[10px] text-slate-500">{{ dateStr(z.id) }}</div>
              </div>
            </div>
          }
        </div>

        <div class="flex flex-wrap gap-2">
          <button class="btn-secondary text-sm" (click)="addZone()">+ Add city</button>
          <button class="btn-ghost text-sm text-rose-600" (click)="removeLast()">Remove last</button>
          <span class="flex-1"></span>
          <button class="btn-primary text-sm" (click)="exportIcs()">📅 Export .ics</button>
        </div>

        @if (addingZone()) {
          <div class="card p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            @for (p of popular; track p.id) {
              <button class="btn-ghost text-xs justify-start" (click)="addPicked(p)">{{ p.label }}</button>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class TimezoneConverter {
  protected popular = POPULAR;
  protected iso = this.toLocalIso(new Date());
  protected anchor = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  protected zones = signal<Zone[]>([
    { id: this.anchor, label: 'Local' },
    { id: 'America/New_York', label: 'New York' },
    { id: 'Europe/London', label: 'London' },
    { id: 'Asia/Tokyo', label: 'Tokyo' },
  ]);
  protected addingZone = signal(false);

  now() { this.iso = this.toLocalIso(new Date()); }

  private get refDate(): Date {
    return this.iso ? new Date(this.iso) : new Date();
  }

  timeStr(tz: string) {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(this.refDate);
  }
  dateStr(tz: string) {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(this.refDate);
  }
  offsetLabel(tz: string) {
    const formatted = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).format(this.refDate);
    const m = formatted.match(/GMT[+-]\d{1,2}(?::\d{2})?|UTC[+-]\d{1,2}/);
    return m?.[0] ?? '';
  }
  minutesInZone(tz: string): number {
    const t = this.timeStr(tz);
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  setFromSlider(tz: string, evt: Event) {
    const minutes = +(evt.target as HTMLInputElement).value;
    // Adjust reference so target zone shows `minutes`.
    const current = this.minutesInZone(tz);
    const delta = minutes - current;
    const d = new Date(this.refDate.getTime() + delta * 60_000);
    this.iso = this.toLocalIso(d);
  }

  addZone() { this.addingZone.update(v => !v); }
  addPicked(z: Zone) {
    this.zones.update(arr => arr.some(x => x.id === z.id) ? arr : [...arr, z]);
    this.addingZone.set(false);
  }
  removeLast() { this.zones.update(arr => arr.slice(0, -1)); }

  exportIcs() {
    const start = this.refDate;
    const end = new Date(start.getTime() + 30 * 60_000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const summary = 'Toolverse meeting';
    const description = this.zones().map((z: Zone) => `${z.label}: ${this.timeStr(z.id)} ${this.dateStr(z.id)}`).join('\\n');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Toolverse//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@toolverse`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'meeting.ics'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private toLocalIso(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
