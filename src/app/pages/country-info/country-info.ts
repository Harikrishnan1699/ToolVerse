import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SectionHeader } from '../../shared/section-header/section-header';

interface Country { name: { common: string; official: string }; cca2: string; flags: { svg: string }; capital?: string[]; population: number; region: string; subregion?: string; languages?: Record<string, string>; currencies?: Record<string, { name: string; symbol: string }>; timezones: string[]; tld?: string[]; area: number; }

@Component({
  selector: 'app-country-info',
  imports: [FormsModule, CommonModule, SectionHeader],
  template: `
    <app-section-header title="Country Info" subtitle="Browse all 250 countries — flags, capitals, population, currency, languages." icon="🌍" color="from-emerald-500 to-cyan-600" />
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <input class="input max-w-md" placeholder="Search country…" [(ngModel)]="q" />
      @if (loading()) { <div class="card p-8 text-center text-slate-500">Loading countries…</div> }
      @else {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          @for (c of filtered(); track c.cca2) {
            <div class="card p-4 hover:shadow-glow transition">
              <div class="flex items-start gap-3">
                <img [src]="c.flags.svg" class="w-14 h-10 rounded shadow-sm border border-slate-200 dark:border-slate-700 object-cover" [alt]="c.name.common" />
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">{{ c.name.common }}</div>
                  <div class="text-xs text-slate-500 truncate">{{ c.cca2 }} · {{ c.region }}</div>
                </div>
              </div>
              <dl class="mt-3 space-y-1 text-xs">
                <div class="flex justify-between"><dt class="text-slate-500">Capital</dt><dd class="font-medium truncate ml-2">{{ c.capital?.[0] ?? '—' }}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-500">Population</dt><dd class="font-medium">{{ c.population | number }}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-500">Currency</dt><dd class="font-medium truncate ml-2">{{ currency(c) }}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-500">Languages</dt><dd class="font-medium truncate ml-2">{{ langs(c) }}</dd></div>
                <div class="flex justify-between"><dt class="text-slate-500">Area</dt><dd class="font-medium">{{ c.area | number }} km²</dd></div>
              </dl>
            </div>
          }
          @if (!filtered().length) { <div class="col-span-full text-center text-slate-500 py-12">No matches.</div> }
        </div>
      }
    </section>
  `,
})
export class CountryInfo implements OnInit {
  private http = inject(HttpClient);
  protected countries = signal<Country[]>([]);
  protected loading = signal(true);
  protected q = '';

  filtered() {
    const q = this.q.toLowerCase().trim();
    if (!q) return this.countries();
    return this.countries().filter(c => c.name.common.toLowerCase().includes(q) || c.cca2.toLowerCase().includes(q) || c.region.toLowerCase().includes(q));
  }

  currency(c: Country) {
    if (!c.currencies) return '—';
    const k = Object.keys(c.currencies)[0];
    return c.currencies[k].name + ' (' + (c.currencies[k].symbol ?? k) + ')';
  }
  langs(c: Country) { return c.languages ? Object.values(c.languages).slice(0, 2).join(', ') : '—'; }

  async ngOnInit() {
    try {
      const res = await firstValueFrom(this.http.get<Country[]>('https://restcountries.com/v3.1/all?fields=name,cca2,flags,capital,population,region,subregion,languages,currencies,timezones,tld,area'));
      this.countries.set(res.sort((a, b) => a.name.common.localeCompare(b.name.common)));
    } catch { /* swallow */ }
    finally { this.loading.set(false); }
  }
}
