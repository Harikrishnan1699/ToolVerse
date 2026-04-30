import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SectionHeader } from '../../shared/section-header/section-header';

interface Holiday { date: string; localName: string; name: string; types: string[]; global: boolean; }

@Component({
  selector: 'app-holidays',
  imports: [FormsModule, CommonModule, SectionHeader],
  template: `
    <app-section-header title="Public Holidays" subtitle="Official public holidays for any country and year — powered by Nager.Date." icon="🎉" color="from-pink-500 to-rose-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-4 flex gap-3 flex-wrap items-end">
        <div>
          <label class="text-xs font-medium">Country</label>
          <select class="input mt-1" [(ngModel)]="country" (ngModelChange)="load()">
            @for (c of countries; track c.code) { <option [ngValue]="c.code">{{ c.name }}</option> }
          </select>
        </div>
        <div>
          <label class="text-xs font-medium">Year</label>
          <input type="number" class="input mt-1 w-28" [(ngModel)]="year" (ngModelChange)="load()" />
        </div>
      </div>

      @if (loading()) { <div class="card p-8 text-center text-slate-500">Loading…</div> }
      @else if (holidays().length) {
        <div class="card p-0 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/40 text-slate-500 text-xs uppercase">
              <tr><th class="text-left p-3">Date</th><th class="text-left p-3">Local name</th><th class="text-left p-3">English</th><th class="text-left p-3 hidden sm:table-cell">Type</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (h of holidays(); track h.date + h.name) {
                <tr>
                  <td class="p-3 whitespace-nowrap font-mono text-xs">{{ h.date | date:'EEE, MMM d' }}</td>
                  <td class="p-3 font-medium">{{ h.localName }}</td>
                  <td class="p-3 text-slate-600 dark:text-slate-400">{{ h.name }}</td>
                  <td class="p-3 hidden sm:table-cell text-xs text-slate-500">{{ h.types.join(', ') }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
    </section>
  `,
})
export class Holidays implements OnInit {
  private http = inject(HttpClient);
  protected country = 'IN';
  protected year = new Date().getFullYear();
  protected holidays = signal<Holiday[]>([]);
  protected loading = signal(false);
  protected error = signal('');
  protected countries = [
    { code: 'IN', name: '🇮🇳 India' }, { code: 'US', name: '🇺🇸 United States' }, { code: 'GB', name: '🇬🇧 United Kingdom' },
    { code: 'AU', name: '🇦🇺 Australia' }, { code: 'CA', name: '🇨🇦 Canada' }, { code: 'DE', name: '🇩🇪 Germany' },
    { code: 'FR', name: '🇫🇷 France' }, { code: 'ES', name: '🇪🇸 Spain' }, { code: 'IT', name: '🇮🇹 Italy' },
    { code: 'JP', name: '🇯🇵 Japan' }, { code: 'BR', name: '🇧🇷 Brazil' }, { code: 'MX', name: '🇲🇽 Mexico' },
    { code: 'NL', name: '🇳🇱 Netherlands' }, { code: 'SE', name: '🇸🇪 Sweden' }, { code: 'CH', name: '🇨🇭 Switzerland' },
    { code: 'SG', name: '🇸🇬 Singapore' }, { code: 'NZ', name: '🇳🇿 New Zealand' }, { code: 'ZA', name: '🇿🇦 South Africa' },
  ];

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true); this.error.set('');
    try {
      const url = `https://date.nager.at/api/v3/PublicHolidays/${this.year}/${this.country}`;
      this.holidays.set(await firstValueFrom(this.http.get<Holiday[]>(url)));
    } catch (e: any) {
      this.error.set('Could not load holidays for that country/year.');
      this.holidays.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
