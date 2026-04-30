import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface RatesRes { amount: number; base: string; date: string; rates: Record<string, number>; }

const FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', INR: '🇮🇳', CNY: '🇨🇳', AUD: '🇦🇺', CAD: '🇨🇦', CHF: '🇨🇭',
  SEK: '🇸🇪', NOK: '🇳🇴', DKK: '🇩🇰', NZD: '🇳🇿', SGD: '🇸🇬', HKD: '🇭🇰', KRW: '🇰🇷', MXN: '🇲🇽', BRL: '🇧🇷',
  ZAR: '🇿🇦', RUB: '🇷🇺', TRY: '🇹🇷', IDR: '🇮🇩', THB: '🇹🇭', MYR: '🇲🇾', PHP: '🇵🇭', PLN: '🇵🇱', CZK: '🇨🇿',
  HUF: '🇭🇺', AED: '🇦🇪', SAR: '🇸🇦', BGN: '🇧🇬', RON: '🇷🇴', ILS: '🇮🇱',
};

@Component({
  selector: 'app-currency',
  imports: [FormsModule, CommonModule],
  template: `
    <section class="relative">
      <div class="absolute inset-0 mesh-bg opacity-50"></div>
      <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <span class="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live · Frankfurter API
        </span>
        <h1 class="mt-3 text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">Currency converter</h1>
        <p class="mt-2 text-slate-600 dark:text-slate-400">Real-time mid-market rates for 30+ currencies, refreshed daily by the European Central Bank.</p>
      </div>
    </section>

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
      <div class="card p-6 lg:p-8">
        <div class="grid lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 items-end">
          <div>
            <label class="text-xs uppercase font-semibold text-slate-500 tracking-wider">From</label>
            <div class="mt-2 flex gap-2">
              <select class="input flex-1" [(ngModel)]="from" (ngModelChange)="convert()">
                @for (c of codes; track c) { <option [value]="c">{{ flag(c) }} {{ c }}</option> }
              </select>
            </div>
            <input type="number" class="input mt-3 text-2xl font-display font-bold !py-4" [(ngModel)]="amount" (ngModelChange)="convert()" />
          </div>

          <button class="btn-secondary self-end h-12 w-12 !p-0 grid place-items-center" title="Swap" (click)="swap()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m-4 6H4m0 0l4 4m-4-4l4-4"/></svg>
          </button>

          <div>
            <label class="text-xs uppercase font-semibold text-slate-500 tracking-wider">To</label>
            <div class="mt-2 flex gap-2">
              <select class="input flex-1" [(ngModel)]="to" (ngModelChange)="convert()">
                @for (c of codes; track c) { <option [value]="c">{{ flag(c) }} {{ c }}</option> }
              </select>
            </div>
            <div class="input mt-3 !py-4 text-2xl font-display font-bold !bg-slate-50 dark:!bg-slate-800/60 !border-slate-100 dark:!border-slate-700">
              @if (loading()) { <span class="text-slate-400">Loading…</span> }
              @else { {{ converted() | number:'1.2-4' }} }
            </div>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div class="text-slate-500">
            1 {{ from }} = <span class="font-semibold text-slate-900 dark:text-white">{{ rate() | number:'1.4-6' }}</span> {{ to }}
          </div>
          <div class="text-slate-500">Updated: {{ date() || '—' }}</div>
          @if (error()) { <div class="text-rose-600">{{ error() }}</div> }
        </div>
      </div>

      <div class="card p-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Popular rates from {{ from }}</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          @for (c of popular; track c) {
            @if (c !== from) {
              <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ flag(c) }}</span>
                  <span class="text-sm font-semibold">{{ c }}</span>
                </div>
                <div class="mt-1 text-xl font-display font-bold">{{ allRates()[c] | number:'1.2-4' }}</div>
              </div>
            }
          }
        </div>
      </div>
    </section>
  `,
})
export class Currency implements OnInit {
  private http = inject(HttpClient);
  protected codes = Object.keys(FLAGS);
  protected popular = ['USD','EUR','GBP','JPY','INR','AUD','CAD','CHF'];

  protected from = 'USD';
  protected to = 'EUR';
  protected amount = 100;
  protected loading = signal(false);
  protected error = signal('');
  protected date = signal('');
  protected allRates = signal<Record<string, number>>({});
  protected rate = computed(() => this.allRates()[this.to] ?? 0);
  protected converted = computed(() => +(this.amount * this.rate()).toFixed(4));

  flag(c: string) { return FLAGS[c] ?? '🏳'; }

  ngOnInit() { this.convert(); }

  async convert() {
    this.loading.set(true); this.error.set('');
    try {
      const url = `https://api.frankfurter.dev/v1/latest?base=${this.from}`;
      const res = await firstValueFrom(this.http.get<RatesRes>(url));
      this.allRates.set(res.rates);
      this.date.set(res.date);
    } catch {
      try {
        const fallback = `https://open.er-api.com/v6/latest/${this.from}`;
        const r = await firstValueFrom(this.http.get<any>(fallback));
        this.allRates.set(r.rates ?? {});
        this.date.set(r.time_last_update_utc?.slice(0, 16) ?? '');
      } catch (e) {
        this.error.set('Could not fetch rates. Check your network.');
      }
    } finally {
      this.loading.set(false);
    }
  }

  swap() {
    const t = this.from; this.from = this.to; this.to = t;
    this.convert();
  }
}
