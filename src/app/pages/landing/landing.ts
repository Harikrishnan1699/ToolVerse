import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Cat { id: string; title: string; desc: string; icon: string; color: string; route: string; count: number; }

const CATEGORIES: Cat[] = [
  { id: 'pdf', title: 'PDF Tools', desc: 'Merge, split, compress, sign, redact, OCR — 19 tools.', icon: '📄', color: 'from-orange-500 to-rose-500', route: '/pdf', count: 19 },
  { id: 'image', title: 'Image Tools', desc: 'Compress, resize, convert, OCR, AI background-remove.', icon: '🖼', color: 'from-purple-500 to-fuchsia-600', route: '/image', count: 9 },
  { id: 'media', title: 'Audio & Video', desc: 'FFmpeg in your browser — convert, trim, compress.', icon: '🎬', color: 'from-pink-500 to-rose-600', route: '/media', count: 5 },
  { id: 'dev', title: 'Developer Tools', desc: 'JSON, Base64, hash, JWT, regex, color, gradient.', icon: '⌨', color: 'from-emerald-500 to-teal-600', route: '/dev', count: 10 },
  { id: 'text', title: 'Text Tools', desc: 'Counter, case, lorem, diff, dedup, find/replace.', icon: '¶', color: 'from-indigo-500 to-violet-600', route: '/text', count: 7 },
  { id: 'calc', title: 'Calculators', desc: 'Unit, age, BMI, loan, tip, GST, Roman, words.', icon: '∑', color: 'from-emerald-500 to-green-600', route: '/calc', count: 10 },
  { id: 'qr', title: 'QR & Codes', desc: 'Generate QR for URL/WiFi/UPI/vCard, scan via camera.', icon: '▦', color: 'from-slate-700 to-slate-900', route: '/qr/generator', count: 2 },
  { id: 'security', title: 'Security', desc: 'Password gen + strength, AES encrypt, fake data.', icon: '🔐', color: 'from-violet-500 to-purple-600', route: '/security/password', count: 3 },
  { id: 'productivity', title: 'Productivity', desc: 'Pomodoro, stopwatch, timer, todo, scratchpad, dice.', icon: '⏱', color: 'from-rose-500 to-orange-500', route: '/productivity', count: 6 },
  { id: 'seo', title: 'SEO Tools', desc: 'Meta tags, OG/Twitter previews, robots, sitemap.', icon: '🏷', color: 'from-blue-500 to-cyan-600', route: '/seo/meta', count: 2 },
  { id: 'currency', title: 'Currency', desc: 'Live exchange rates, 30+ currencies.', icon: '$', color: 'from-green-500 to-emerald-600', route: '/currency', count: 1 },
  { id: 'crypto', title: 'Crypto', desc: 'Top 100 coins, sparklines, 24h/7d change.', icon: '₿', color: 'from-yellow-500 to-orange-500', route: '/crypto', count: 1 },
  { id: 'weather', title: 'Weather', desc: 'Current + 24h + 7-day forecast worldwide.', icon: '☀', color: 'from-cyan-500 to-sky-600', route: '/weather', count: 1 },
  { id: 'country', title: 'Country Info', desc: 'All 250 countries — flags, capitals, currency.', icon: '🌍', color: 'from-emerald-500 to-cyan-600', route: '/country', count: 1 },
  { id: 'ip', title: 'IP Lookup', desc: 'Geolocate any IP — city, ISP, timezone.', icon: '🌐', color: 'from-sky-500 to-indigo-600', route: '/ip', count: 1 },
  { id: 'holidays', title: 'Public Holidays', desc: 'Official holidays for 18+ countries.', icon: '🎉', color: 'from-pink-500 to-rose-600', route: '/holidays', count: 1 },
];

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 mesh-bg"></div>
      <div class="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 opacity-20 blur-3xl animate-float"></div>
      <div class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-20 blur-3xl animate-float" style="animation-delay:-3s"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-20 text-center">
        <span class="chip bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-100 dark:border-brand-900/60">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          {{ totalTools() }}+ tools · 100% client-side · Free forever
        </span>
        <h1 class="mt-5 text-5xl lg:text-7xl font-display font-bold tracking-tight leading-[1.05] text-slate-900 dark:text-white">
          The <span class="gradient-text">everything</span> toolkit
        </h1>
        <p class="mt-6 text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          PDF, image, audio, video, developer, text, calculators, QR, security, productivity, SEO and live data — all in one beautifully crafted, privacy-first app.
        </p>
        <div class="mt-8 flex flex-wrap gap-3 justify-center">
          <a routerLink="/pdf" class="btn-primary text-base px-7 py-3.5">Browse PDF Tools</a>
          <a routerLink="/dev" class="btn-secondary text-base px-7 py-3.5">Developer Tools</a>
        </div>
      </div>
    </section>

    <section class="py-12 lg:py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 class="text-2xl lg:text-3xl font-display font-bold text-slate-900 dark:text-white mb-8">All categories</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          @for (c of cats; track c.id) {
            <a [routerLink]="c.route" class="group card p-6 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 relative overflow-hidden">
              <div class="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br {{ c.color }} opacity-10 group-hover:opacity-30 transition"></div>
              <div class="relative">
                <div class="w-14 h-14 rounded-2xl bg-gradient-to-br {{ c.color }} grid place-items-center text-white text-2xl shadow-lg group-hover:scale-110 transition">{{ c.icon }}</div>
                <h3 class="mt-4 text-lg font-display font-bold text-slate-900 dark:text-white">{{ c.title }}</h3>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ c.desc }}</p>
                <div class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 group-hover:gap-2 transition-all">
                  Explore
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </div>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <section class="py-12 lg:py-20 bg-slate-50 dark:bg-slate-950/50">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">Built right.</h2>
        <p class="mt-3 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">No accounts. No uploads. No tracking. Every tool runs in your browser using cutting-edge WebAssembly and the modern web platform.</p>
        <div class="mt-10 grid sm:grid-cols-4 gap-4">
          <div class="card p-6"><div class="text-3xl">🔒</div><div class="mt-2 font-semibold">Private</div><div class="text-xs text-slate-500 mt-1">Files never leave your device</div></div>
          <div class="card p-6"><div class="text-3xl">⚡</div><div class="mt-2 font-semibold">Fast</div><div class="text-xs text-slate-500 mt-1">Angular 21 zoneless, lazy-loaded</div></div>
          <div class="card p-6"><div class="text-3xl">🆓</div><div class="mt-2 font-semibold">Free</div><div class="text-xs text-slate-500 mt-1">No paywalls, no ads</div></div>
          <div class="card p-6"><div class="text-3xl">🌗</div><div class="mt-2 font-semibold">Themed</div><div class="text-xs text-slate-500 mt-1">Light & dark, your choice</div></div>
        </div>
      </div>
    </section>

    <section class="py-20 lg:py-24">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-fuchsia-600 p-10 lg:p-16 text-center shadow-glow">
          <div class="absolute inset-0 mesh-bg opacity-30"></div>
          <div class="relative">
            <h2 class="text-3xl lg:text-5xl font-display font-bold text-white">Pick a tool, get going.</h2>
            <p class="mt-3 text-white/80 max-w-xl mx-auto">No accounts, no installs, no friction.</p>
            <div class="mt-7 flex flex-wrap gap-3 justify-center">
              <a routerLink="/pdf/merge" class="btn bg-white text-slate-900 hover:bg-slate-100">Merge PDF</a>
              <a routerLink="/dev/json" class="btn bg-white/10 text-white border border-white/30 hover:bg-white/20 backdrop-blur">JSON Formatter</a>
              <a routerLink="/qr/generator" class="btn bg-white/10 text-white border border-white/30 hover:bg-white/20 backdrop-blur">QR Generator</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class Landing {
  protected cats = CATEGORIES;
  totalTools() { return this.cats.reduce((s, c) => s + c.count, 0); }
}
