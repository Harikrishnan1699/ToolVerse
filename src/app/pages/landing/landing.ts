import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Cat { id: string; title: string; desc: string; icon: string; color: string; route: string; count: number; }
interface QuickTool { name: string; icon: string; color: string; route: string; }
interface Daily { name: string; desc: string; icon: string; color: string; route: string; }

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
  { id: 'typing-test', title: 'Typing Test', desc: 'Live WPM & accuracy — easy / medium / hard levels.', icon: '⌨', color: 'from-indigo-500 to-purple-600', route: '/typing-test', count: 1 },
  { id: 'ai-writer', title: 'AI Writing Assistant', desc: 'Grammar, style & AI rewrites — free LanguageTool + BYOK AI.', icon: '✍', color: 'from-indigo-500 to-fuchsia-600', route: '/ai-writer', count: 1 },
  { id: 'seo', title: 'SEO Tools', desc: 'Meta tags, OG/Twitter previews, robots, sitemap.', icon: '🏷', color: 'from-blue-500 to-cyan-600', route: '/seo/meta', count: 2 },
  { id: 'currency', title: 'Currency', desc: 'Live exchange rates, 30+ currencies.', icon: '$', color: 'from-green-500 to-emerald-600', route: '/currency', count: 1 },
  { id: 'crypto', title: 'Crypto', desc: 'Top 100 coins, sparklines, 24h/7d change.', icon: '₿', color: 'from-yellow-500 to-orange-500', route: '/crypto', count: 1 },
  { id: 'weather', title: 'Weather', desc: 'Current + 24h + 7-day forecast worldwide.', icon: '☀', color: 'from-cyan-500 to-sky-600', route: '/weather', count: 1 },
  { id: 'country', title: 'Country Info', desc: 'All 250 countries — flags, capitals, currency.', icon: '🌍', color: 'from-emerald-500 to-cyan-600', route: '/country', count: 1 },
  { id: 'ip', title: 'IP Lookup', desc: 'Geolocate any IP — city, ISP, timezone.', icon: '🌐', color: 'from-sky-500 to-indigo-600', route: '/ip', count: 1 },
  { id: 'holidays', title: 'Public Holidays', desc: 'Official holidays for 18+ countries.', icon: '🎉', color: 'from-pink-500 to-rose-600', route: '/holidays', count: 1 },
];

const QUICK_TOOLS: QuickTool[] = [
  { name: 'Merge PDF',      icon: '📄', color: 'from-orange-500 to-amber-500',  route: '/pdf/merge' },
  { name: 'Screen Recorder',icon: '🎥', color: 'from-rose-500 to-pink-600',    route: '/screen-recorder' },
  { name: 'API Tester',     icon: '⚡', color: 'from-amber-500 to-orange-600',  route: '/api-tester' },
  { name: 'JSON',           icon: '{}',  color: 'from-emerald-500 to-teal-600',  route: '/dev/json' },
  { name: 'HTML Formatter', icon: '</>', color: 'from-orange-500 to-rose-500',   route: '/dev/html' },
  { name: 'QR Generator',   icon: '▦',   color: 'from-slate-700 to-slate-900',   route: '/qr/generator' },
  { name: 'Invoice',        icon: '🧾',  color: 'from-emerald-500 to-green-600', route: '/invoice-generator' },
  { name: 'AI Writer',      icon: '✍',  color: 'from-indigo-500 to-fuchsia-600', route: '/ai-writer' },
];

const DAILY: Daily[] = [
  { name: 'Resume Maker',    desc: 'Live preview, multiple templates, export as PDF — fully local.', icon: '📄', color: 'from-emerald-500 to-teal-600',  route: '/resume-maker' },
  { name: 'Screen Recorder', desc: 'Record tab, window or screen with mic — saves WebM locally.', icon: '🎥', color: 'from-rose-500 to-pink-600',    route: '/screen-recorder' },
  { name: 'API Tester',      desc: 'Mini-Postman. GET/POST/etc, headers, auth, history.',         icon: '⚡', color: 'from-amber-500 to-orange-600',  route: '/api-tester' },
  { name: 'Invoice Generator', desc: 'Branded invoices to PDF — no signup, no watermarks.',       icon: '🧾', color: 'from-emerald-500 to-green-600', route: '/invoice-generator' },
  { name: 'Time Zone Planner', desc: 'Find a meeting time that works across every zone.',         icon: '🌐', color: 'from-sky-500 to-indigo-600',    route: '/timezone-converter' },
  { name: 'EXIF Stripper',   desc: 'Drop images — get them back without GPS/camera metadata.',    icon: '🧽', color: 'from-violet-500 to-fuchsia-600',route: '/exif-stripper' },
  { name: 'Data Converter',  desc: 'JSON ↔ CSV ↔ YAML ↔ XML. Paste, pick output, copy.',         icon: '⇄', color: 'from-cyan-500 to-blue-600',     route: '/dev/data-convert' },
  { name: 'SQL Formatter',   desc: 'Pretty-print messy SQL with indent & keyword casing.',        icon: '📊', color: 'from-blue-500 to-indigo-600',   route: '/dev/sql' },
  { name: 'Cron Builder',    desc: 'Visual builder + plain-English description + next 5 runs.',   icon: '⏰', color: 'from-orange-500 to-amber-600',  route: '/dev/cron' },
  { name: 'TOTP / 2FA',      desc: 'Generate one-time codes from any otpauth:// secret.',         icon: '🔐', color: 'from-emerald-500 to-cyan-600',  route: '/security/totp' },
  { name: 'URL Cleaner',     desc: 'Strip utm_*, fbclid, gclid and 30+ trackers from links.',     icon: '🧹', color: 'from-emerald-500 to-teal-600',  route: '/security/url-clean' },
  { name: 'Breach Check',    desc: 'Has your password leaked? Verified locally via HIBP.',        icon: '🛡', color: 'from-rose-500 to-pink-600',     route: '/security/breach' },
  { name: 'Tax & SIP Calc',  desc: 'Income tax (IN/US), SIP, lumpsum, FD — all in one.',          icon: '💰', color: 'from-emerald-500 to-green-600', route: '/calc/tax' },
  { name: 'Health Calc',     desc: 'Sleep cycles, BMR/macros, water intake, running pace.',       icon: '❤', color: 'from-pink-500 to-rose-600',     route: '/calc/health' },
  { name: 'Email Signature', desc: 'Build a polished HTML signature — paste into any mail app.',  icon: '✉', color: 'from-sky-500 to-indigo-600',    route: '/email-signature' },
  { name: 'Markdown Table',  desc: 'Visual grid editor → clean Markdown & HTML output.',          icon: '▦', color: 'from-amber-500 to-orange-600',  route: '/markdown-table' },
  { name: 'Habit Tracker',   desc: 'Streaks, 30-day grid — 100% local, no account.',              icon: '🎯', color: 'from-emerald-500 to-teal-600',  route: '/habit-tracker' },
  { name: 'Palette Extractor', desc: 'Drop an image — get its dominant colors as hex & CSS.',     icon: '🎨', color: 'from-fuchsia-500 to-pink-600',  route: '/image/palette' },
];

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `
    <!-- COMPACT HERO + QUICK TOOLS (above the fold) -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 mesh-bg"></div>
      <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-gradient-to-br from-brand-500 to-fuchsia-500 opacity-20 blur-3xl animate-float"></div>
      <div class="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-20 blur-3xl animate-float" style="animation-delay:-3s"></div>

      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 lg:pt-12 lg:pb-14">
        <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 lg:gap-12 items-center">

          <!-- LEFT — compact hero -->
          <div>
            <span class="chip bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-100 dark:border-brand-900/60">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {{ totalTools() }}+ tools · 100% client-side · Free
            </span>
            <h1 class="mt-4 text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight leading-[1.1] text-slate-900 dark:text-white">
              The <span class="gradient-text">everything</span> toolkit
            </h1>
            <p class="mt-3 text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              PDF, image, audio, video, developer, text & more — all in one privacy-first app. No uploads, no tracking.
            </p>
            <div class="mt-5 flex flex-wrap gap-2">
              <a routerLink="/pdf" class="btn-primary text-sm px-5 py-2.5">Browse PDF Tools</a>
              <a routerLink="/dev" class="btn-secondary text-sm px-5 py-2.5">Developer Tools</a>
            </div>

            <div class="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> No uploads</span>
              <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Works offline</span>
              <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Installable PWA</span>
            </div>
          </div>

          <!-- RIGHT — quick tool tiles, visible immediately -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Quick start</div>
              <a routerLink="/pdf" class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">View all →</a>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              @for (q of quickTools; track q.route; let i = $index) {
                <a [routerLink]="q.route"
                   class="group relative card p-3 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 overflow-hidden"
                   [style.animationDelay.ms]="i * 30"
                   style="animation: tile-in 0.35s ease both;">
                  <div class="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition bg-gradient-to-br {{ q.color }} blur-2xl"></div>
                  <div class="relative flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-lg bg-gradient-to-br {{ q.color }} grid place-items-center text-white text-sm font-bold shadow-md group-hover:scale-110 group-hover:rotate-3 transition shrink-0">{{ q.icon }}</div>
                    <div class="font-semibold text-xs leading-tight truncate">{{ q.name }}</div>
                  </div>
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ALL CATEGORIES -->
    <section class="py-10 lg:py-14">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h2 class="text-2xl lg:text-3xl font-display font-bold text-slate-900 dark:text-white">All categories</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ cats.length }} hubs · {{ totalTools() }} tools total</p>
          </div>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          @for (c of cats; track c.id; let i = $index) {
            <a [routerLink]="c.route"
               class="group relative card p-4 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 overflow-hidden"
               [style.animationDelay.ms]="i * 25"
               style="animation: tile-in 0.35s ease both;">
              <div class="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br {{ c.color }} opacity-10 group-hover:opacity-30 transition"></div>
              <span class="absolute top-2 right-2 chip text-[10px] !px-1.5 !py-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 z-10">{{ c.count }}</span>
              <div class="relative flex items-start gap-3">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br {{ c.color }} grid place-items-center text-white text-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition shrink-0">{{ c.icon }}</div>
                <div class="min-w-0 pr-6">
                  <h3 class="font-display font-bold text-sm text-slate-900 dark:text-white">{{ c.title }}</h3>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ c.desc }}</p>
                </div>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- DAILY ESSENTIALS — new tools -->
    <section class="py-10 lg:py-14 bg-slate-50/50 dark:bg-slate-950/30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-end justify-between mb-6 gap-3 flex-wrap">
          <div>
            <div class="inline-flex items-center gap-2">
              <span class="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/60">NEW</span>
              <h2 class="text-2xl lg:text-3xl font-display font-bold text-slate-900 dark:text-white">Daily essentials</h2>
            </div>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Built for everyday workflows — finance, dev, productivity, security.</p>
          </div>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          @for (d of daily; track d.route; let i = $index) {
            <a [routerLink]="d.route"
               class="group relative card p-4 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 overflow-hidden"
               [style.animationDelay.ms]="i * 25"
               style="animation: tile-in 0.35s ease both;">
              <div class="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br {{ d.color }} opacity-10 group-hover:opacity-30 transition"></div>
              <div class="relative flex items-start gap-3">
                <div class="w-11 h-11 rounded-xl bg-gradient-to-br {{ d.color }} grid place-items-center text-white text-lg shadow-md group-hover:scale-110 group-hover:rotate-3 transition shrink-0">{{ d.icon }}</div>
                <div class="min-w-0">
                  <h3 class="font-display font-bold text-sm text-slate-900 dark:text-white">{{ d.name }}</h3>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ d.desc }}</p>
                </div>
              </div>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- BUILT RIGHT -->
    <section class="py-10 lg:py-16 bg-slate-50 dark:bg-slate-950/50">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-2xl lg:text-4xl font-display font-bold text-slate-900 dark:text-white">Built right.</h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">No accounts. No uploads. No tracking. Every tool runs in your browser using WebAssembly and the modern web platform.</p>
        <div class="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="card p-5"><div class="text-2xl">🔒</div><div class="mt-1 font-semibold text-sm">Private</div><div class="text-xs text-slate-500 mt-0.5">Files stay on device</div></div>
          <div class="card p-5"><div class="text-2xl">⚡</div><div class="mt-1 font-semibold text-sm">Fast</div><div class="text-xs text-slate-500 mt-0.5">Angular 21, lazy-loaded</div></div>
          <div class="card p-5"><div class="text-2xl">🆓</div><div class="mt-1 font-semibold text-sm">Free</div><div class="text-xs text-slate-500 mt-0.5">No paywalls, no ads</div></div>
          <div class="card p-5"><div class="text-2xl">🌗</div><div class="mt-1 font-semibold text-sm">Themed</div><div class="text-xs text-slate-500 mt-0.5">Light & dark, your choice</div></div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-14 lg:py-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-600 to-fuchsia-600 p-8 lg:p-14 text-center shadow-glow">
          <div class="absolute inset-0 mesh-bg opacity-30"></div>
          <div class="relative">
            <h2 class="text-2xl lg:text-4xl font-display font-bold text-white">Pick a tool, get going.</h2>
            <p class="mt-2 text-white/80 max-w-xl mx-auto text-sm">No accounts, no installs, no friction.</p>
            <div class="mt-6 flex flex-wrap gap-2.5 justify-center">
              <a routerLink="/pdf/merge" class="btn bg-white text-slate-900 hover:bg-slate-100 text-sm">Merge PDF</a>
              <a routerLink="/dev/json" class="btn bg-white/10 text-white border border-white/30 hover:bg-white/20 backdrop-blur text-sm">JSON Formatter</a>
              <a routerLink="/qr/generator" class="btn bg-white/10 text-white border border-white/30 hover:bg-white/20 backdrop-blur text-sm">QR Generator</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    @keyframes tile-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `],
})
export class Landing {
  protected cats = CATEGORIES;
  protected quickTools = QUICK_TOOLS;
  protected daily = DAILY;
  totalTools() { return this.cats.reduce((s, c) => s + c.count, 0) + this.daily.length; }
}
