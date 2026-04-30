import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-4">
        <div class="md:col-span-2">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-500 to-fuchsia-500 grid place-items-center text-white font-black text-lg shadow-glow">T</div>
            <div class="font-display font-bold text-lg text-slate-900 dark:text-white">Toolverse</div>
          </div>
          <p class="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-md">A modern utility hub. PDF manipulation, live currency, crypto and weather — built with Angular 21, free APIs, and zero ads.</p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">PDF Tools</h3>
          <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><a routerLink="/pdf/merge" class="hover:text-brand-600">Merge PDF</a></li>
            <li><a routerLink="/pdf/split" class="hover:text-brand-600">Split PDF</a></li>
            <li><a routerLink="/pdf/compress" class="hover:text-brand-600">Compress PDF</a></li>
            <li><a routerLink="/pdf/watermark" class="hover:text-brand-600">Watermark</a></li>
          </ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Live Data</h3>
          <ul class="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li><a routerLink="/currency" class="hover:text-brand-600">Currency Converter</a></li>
            <li><a routerLink="/crypto" class="hover:text-brand-600">Cryptocurrency</a></li>
            <li><a routerLink="/weather" class="hover:text-brand-600">Weather</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-slate-200 dark:border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>© {{ year }} Toolverse. All processing happens in your browser.</div>
          <div class="flex items-center gap-4">
            <span>Powered by Open-Meteo · Frankfurter · CoinGecko</span>
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class Footer {
  protected year = new Date().getFullYear();
}
