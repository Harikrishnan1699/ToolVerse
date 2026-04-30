import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

@Component({
  selector: 'app-crypto',
  imports: [FormsModule, CommonModule],
  template: `
    <section class="relative">
      <div class="absolute inset-0 mesh-bg opacity-50"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span class="chip bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live · CoinGecko · refresh {{ countdown() }}s
            </span>
            <h1 class="mt-3 text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">Cryptocurrency</h1>
            <p class="mt-2 text-slate-600 dark:text-slate-400">Top 100 coins by market cap with 24h & 7d change, sparklines and live prices.</p>
          </div>
          <div class="flex items-center gap-2">
            <select class="input w-auto" [(ngModel)]="vs" (ngModelChange)="load()">
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="inr">INR (₹)</option>
              <option value="gbp">GBP (£)</option>
              <option value="jpy">JPY (¥)</option>
            </select>
            <button class="btn-secondary" (click)="load()" [disabled]="loading()">
              @if (loading()) { Loading… } @else { Refresh }
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="mb-4 flex items-center gap-2">
        <input class="input max-w-sm" placeholder="Search by name or symbol…" [(ngModel)]="query" />
      </div>

      @if (error()) { <div class="card p-4 text-rose-600">{{ error() }}</div> }

      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3 text-left">#</th>
                <th class="px-4 py-3 text-left">Coin</th>
                <th class="px-4 py-3 text-right">Price</th>
                <th class="px-4 py-3 text-right hidden sm:table-cell">24h</th>
                <th class="px-4 py-3 text-right hidden md:table-cell">7d</th>
                <th class="px-4 py-3 text-right hidden lg:table-cell">Market cap</th>
                <th class="px-4 py-3 text-right hidden lg:table-cell">Volume (24h)</th>
                <th class="px-4 py-3 text-right hidden xl:table-cell">7d chart</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (c of filtered(); track c.id) {
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                  <td class="px-4 py-3 text-slate-500 font-medium">{{ c.market_cap_rank }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <img [src]="c.image" class="w-7 h-7 rounded-full" [alt]="c.name" />
                      <div>
                        <div class="font-semibold text-slate-900 dark:text-white">{{ c.name }}</div>
                        <div class="text-xs text-slate-500 uppercase">{{ c.symbol }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right font-display font-semibold">{{ symbol() }}{{ c.current_price | number:'1.2-6' }}</td>
                  <td class="px-4 py-3 text-right hidden sm:table-cell" [class.text-emerald-600]="c.price_change_percentage_24h >= 0" [class.text-rose-600]="c.price_change_percentage_24h < 0">
                    {{ c.price_change_percentage_24h >= 0 ? '▲' : '▼' }} {{ c.price_change_percentage_24h | number:'1.2-2' }}%
                  </td>
                  <td class="px-4 py-3 text-right hidden md:table-cell" [class.text-emerald-600]="(c.price_change_percentage_7d_in_currency ?? 0) >= 0" [class.text-rose-600]="(c.price_change_percentage_7d_in_currency ?? 0) < 0">
                    {{ (c.price_change_percentage_7d_in_currency ?? 0) | number:'1.2-2' }}%
                  </td>
                  <td class="px-4 py-3 text-right hidden lg:table-cell text-slate-700 dark:text-slate-200">{{ symbol() }}{{ short(c.market_cap) }}</td>
                  <td class="px-4 py-3 text-right hidden lg:table-cell text-slate-700 dark:text-slate-200">{{ symbol() }}{{ short(c.total_volume) }}</td>
                  <td class="px-4 py-3 text-right hidden xl:table-cell">
                    <svg [attr.viewBox]="'0 0 100 30'" class="w-24 h-8 ml-auto" [class.text-emerald-500]="(c.price_change_percentage_7d_in_currency ?? 0) >= 0" [class.text-rose-500]="(c.price_change_percentage_7d_in_currency ?? 0) < 0">
                      <path [attr.d]="spark(c)" stroke="currentColor" stroke-width="1.5" fill="none" />
                    </svg>
                  </td>
                </tr>
              }
              @if (!filtered().length && !loading()) {
                <tr><td colspan="8" class="p-10 text-center text-slate-500">No matches.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `,
  providers: [DecimalPipe],
})
export class Crypto implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  protected coins = signal<Coin[]>([]);
  protected loading = signal(false);
  protected error = signal('');
  protected vs = 'usd';
  protected query = '';
  protected countdown = signal(60);
  private timer: any;

  protected filtered = computed(() => {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.coins();
    return this.coins().filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  });

  ngOnInit() {
    this.load();
    this.timer = setInterval(() => {
      const c = this.countdown() - 1;
      if (c <= 0) { this.load(); this.countdown.set(60); }
      else this.countdown.set(c);
    }, 1000);
  }
  ngOnDestroy() { clearInterval(this.timer); }

  symbol() {
    return ({ usd: '$', eur: '€', inr: '₹', gbp: '£', jpy: '¥' } as Record<string,string>)[this.vs] ?? '';
  }

  async load() {
    this.loading.set(true); this.error.set('');
    try {
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${this.vs}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d`;
      const res = await firstValueFrom(this.http.get<Coin[]>(url));
      this.coins.set(res);
    } catch (e) {
      this.error.set('CoinGecko request failed (rate limit or network). Try again in a moment.');
    } finally {
      this.loading.set(false);
    }
  }

  short(n: number) {
    if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
    return n.toFixed(0);
  }

  spark(c: Coin) {
    const pts = c.sparkline_in_7d?.price ?? [];
    if (pts.length < 2) return '';
    const min = Math.min(...pts), max = Math.max(...pts);
    const range = max - min || 1;
    const w = 100, h = 30;
    return pts.map((p, i) => {
      const x = (i / (pts.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
  }
}
