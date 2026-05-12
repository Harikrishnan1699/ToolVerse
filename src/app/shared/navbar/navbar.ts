import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../theme.service';

interface Item { label: string; route: string; icon: string; color: string; desc?: string; }
interface Group { label: string; items: Item[]; cols?: 1 | 2 | 3 | 4; align?: 'left' | 'right'; }

const GROUPS: Group[] = [
  { label: 'PDF', cols: 2, items: [
    { label: 'All PDF tools',  route: '/pdf',            icon: '📚', color: 'from-slate-500 to-slate-700',  desc: 'Browse 19 tools' },
    { label: 'Merge',          route: '/pdf/merge',      icon: '🔗', color: 'from-orange-500 to-amber-500',  desc: 'Combine PDFs' },
    { label: 'Split',          route: '/pdf/split',      icon: '✂',  color: 'from-rose-500 to-pink-600',     desc: 'Break into parts' },
    { label: 'Compress',       route: '/pdf/compress',   icon: '🗜', color: 'from-emerald-500 to-teal-600',  desc: 'Reduce file size' },
    { label: 'Sign',           route: '/pdf/sign',       icon: '✍',  color: 'from-indigo-500 to-violet-600', desc: 'Add signature' },
    { label: 'Redact',         route: '/pdf/redact',     icon: '🛡', color: 'from-red-500 to-rose-600',      desc: 'Black out content' },
    { label: 'Watermark',      route: '/pdf/watermark',  icon: '💧', color: 'from-cyan-500 to-blue-600',     desc: 'Brand each page' },
    { label: 'Protect',        route: '/pdf/protect',    icon: '🔒', color: 'from-violet-500 to-purple-600', desc: 'Password lock' },
  ]},
  { label: 'Image', cols: 2, items: [
    { label: 'All image tools',route: '/image',                 icon: '🖼',  color: 'from-purple-500 to-fuchsia-600', desc: 'Browse 9 tools' },
    { label: 'Compress',       route: '/image/compress',        icon: '🗜', color: 'from-emerald-500 to-teal-600',  desc: 'Shrink size' },
    { label: 'Resize',         route: '/image/resize',          icon: '⤡',  color: 'from-sky-500 to-cyan-600',      desc: 'Set dimensions' },
    { label: 'OCR',            route: '/image/ocr',             icon: '🔤', color: 'from-amber-500 to-orange-600',  desc: 'Image to text' },
    { label: 'BG remove',      route: '/image/background-remove', icon: '✨', color: 'from-pink-500 to-rose-600',    desc: 'AI in browser' },
    { label: 'Favicon',        route: '/image/favicon',         icon: '⭐', color: 'from-yellow-500 to-amber-600',  desc: 'Generate icons' },
    { label: 'Meme',           route: '/image/meme',            icon: '😂', color: 'from-orange-500 to-rose-600',   desc: 'Add captions' },
    { label: 'Palette',        route: '/image/palette',         icon: '🎨', color: 'from-fuchsia-500 to-pink-600',  desc: 'Extract colors' },
    { label: 'EXIF stripper',  route: '/exif-stripper',         icon: '🧽', color: 'from-violet-500 to-fuchsia-600',desc: 'Remove metadata' },
  ]},
  { label: 'Media', cols: 1, items: [
    { label: 'Video to GIF',   route: '/media/video-to-gif',    icon: '🎞', color: 'from-pink-500 to-rose-600',    desc: 'In-browser FFmpeg' },
    { label: 'Compress video', route: '/media/video-compress',  icon: '🎬', color: 'from-rose-500 to-orange-600',  desc: 'Smaller MP4s' },
    { label: 'Audio convert',  route: '/media/audio-convert',   icon: '🎵', color: 'from-cyan-500 to-blue-600',    desc: 'MP3 / WAV / OGG' },
    { label: 'Screen Recorder',route: '/screen-recorder',       icon: '🎥', color: 'from-rose-500 to-pink-600',    desc: 'Capture screen + mic' },
  ]},
  { label: 'Dev', cols: 3, items: [
    { label: 'All dev tools',  route: '/dev',                   icon: '⌨',  color: 'from-slate-500 to-slate-700',   desc: 'Browse hub' },
    { label: 'JSON',           route: '/dev/json',              icon: '{}', color: 'from-emerald-500 to-teal-600',  desc: 'Format & validate' },
    { label: 'Base64',         route: '/dev/base64',            icon: '🔤', color: 'from-cyan-500 to-blue-600',     desc: 'Encode / decode' },
    { label: 'URL',            route: '/dev/url',               icon: '🔗', color: 'from-sky-500 to-indigo-600',    desc: 'Encode params' },
    { label: 'Hash',           route: '/dev/hash',              icon: '#',  color: 'from-violet-500 to-purple-600', desc: 'MD5 / SHA' },
    { label: 'JWT',            route: '/dev/jwt',               icon: '🎟', color: 'from-orange-500 to-amber-600',  desc: 'Decode tokens' },
    { label: 'UUID',           route: '/dev/uuid',              icon: '🆔', color: 'from-emerald-500 to-green-600', desc: 'Generate IDs' },
    { label: 'Regex',          route: '/dev/regex',             icon: '/.', color: 'from-rose-500 to-pink-600',     desc: 'Test patterns' },
    { label: 'Color',          route: '/dev/color',             icon: '🎨', color: 'from-fuchsia-500 to-purple-600',desc: 'Picker & convert' },
    { label: 'Gradient',       route: '/dev/gradient',          icon: '🌈', color: 'from-pink-500 to-orange-500',   desc: 'CSS gradients' },
    { label: 'Box shadow',     route: '/dev/box-shadow',        icon: '◻',  color: 'from-slate-500 to-slate-700',   desc: 'Visual builder' },
    { label: 'HTML',           route: '/dev/html',              icon: '</>', color: 'from-orange-500 to-rose-500',  desc: 'Format / minify' },
    { label: 'API Tester',     route: '/api-tester',            icon: '⚡', color: 'from-amber-500 to-orange-600',  desc: 'Mini Postman' },
    { label: 'Data Convert',   route: '/dev/data-convert',      icon: '⇄',  color: 'from-cyan-500 to-blue-600',     desc: 'JSON ↔ CSV ↔ YAML' },
    { label: 'SQL Formatter',  route: '/dev/sql',               icon: '📊', color: 'from-blue-500 to-indigo-600',   desc: 'Pretty-print SQL' },
    { label: 'Cron Builder',   route: '/dev/cron',              icon: '⏰', color: 'from-orange-500 to-amber-600',  desc: 'Visual cron' },
    { label: 'Gzip / Deflate', route: '/dev/compress-text',     icon: '🗜', color: 'from-emerald-500 to-teal-600',  desc: 'Compress text' },
  ]},
  { label: 'More', cols: 3, items: [
    { label: 'Text tools',     route: '/text',                  icon: '¶',  color: 'from-indigo-500 to-violet-600', desc: 'Counter, case, diff' },
    { label: 'Markdown',       route: '/text/markdown',         icon: 'M↓', color: 'from-slate-500 to-slate-700',   desc: 'Live editor' },
    { label: 'Translator',     route: '/text/translate',        icon: '🌐', color: 'from-sky-500 to-cyan-600',      desc: 'Free translate' },
    { label: 'Calculators',    route: '/calc',                  icon: '∑',  color: 'from-emerald-500 to-green-600', desc: 'Unit, age, BMI' },
    { label: 'Tax & SIP',      route: '/calc/tax',              icon: '💰', color: 'from-emerald-500 to-green-600', desc: 'IN/US income tax' },
    { label: 'Health Calc',    route: '/calc/health',           icon: '❤',  color: 'from-pink-500 to-rose-600',     desc: 'Sleep, BMR, water' },
    { label: 'QR generator',   route: '/qr/generator',          icon: '▦',  color: 'from-slate-700 to-slate-900',   desc: 'URL/WiFi/UPI' },
    { label: 'QR scanner',     route: '/qr/scanner',            icon: '📷', color: 'from-slate-700 to-slate-900',   desc: 'Camera scan' },
    { label: 'Typing test',    route: '/typing-test',           icon: '⌨',  color: 'from-indigo-500 to-purple-600', desc: 'Live WPM' },
    { label: 'AI Writer',      route: '/ai-writer',             icon: '✍',  color: 'from-indigo-500 to-fuchsia-600',desc: 'Grammar + rewrite' },
    { label: 'Productivity',   route: '/productivity',          icon: '⏱', color: 'from-rose-500 to-orange-500',   desc: 'Pomodoro & more' },
    { label: 'Habit tracker',  route: '/habit-tracker',         icon: '🎯', color: 'from-emerald-500 to-teal-600',  desc: 'Build streaks' },
    { label: 'Resume maker',   route: '/resume-maker',          icon: '📄', color: 'from-emerald-500 to-teal-600',  desc: 'Build & export resume' },
    { label: 'Invoice',        route: '/invoice-generator',     icon: '🧾', color: 'from-emerald-500 to-green-600', desc: 'PDF invoices' },
    { label: 'Timezone',       route: '/timezone-converter',    icon: '🌐', color: 'from-sky-500 to-indigo-600',    desc: 'Meeting planner' },
    { label: 'Email signature',route: '/email-signature',       icon: '✉',  color: 'from-sky-500 to-indigo-600',    desc: 'HTML signature' },
    { label: 'Markdown table', route: '/markdown-table',        icon: '▦',  color: 'from-amber-500 to-orange-600',  desc: 'Visual builder' },
    { label: 'Password tools', route: '/security/password',     icon: '🔑', color: 'from-violet-500 to-purple-600', desc: 'Generate & strength' },
    { label: 'AES encrypt',    route: '/security/aes',          icon: '🔐', color: 'from-rose-500 to-purple-600',   desc: 'Encrypt text' },
    { label: 'TOTP / 2FA',     route: '/security/totp',         icon: '🔐', color: 'from-emerald-500 to-cyan-600',  desc: 'One-time codes' },
    { label: 'URL cleaner',    route: '/security/url-clean',    icon: '🧹', color: 'from-emerald-500 to-teal-600',  desc: 'Strip trackers' },
    { label: 'Breach check',   route: '/security/breach',       icon: '🛡', color: 'from-rose-500 to-pink-600',     desc: 'HIBP lookup' },
    { label: 'Fake data',      route: '/security/faker',        icon: '🎲', color: 'from-amber-500 to-orange-600',  desc: 'Mock data' },
    { label: 'Meta generator', route: '/seo/meta',              icon: '🏷', color: 'from-blue-500 to-cyan-600',     desc: 'OG / Twitter' },
    { label: 'Robots / sitemap',route: '/seo/robots',           icon: '🤖', color: 'from-slate-500 to-slate-700',   desc: 'SEO files' },
  ]},
  { label: 'Hardware', cols: 1, items: [
    { label: 'NFC reader / writer', route: '/hw/nfc',           icon: '📡', color: 'from-indigo-500 to-blue-600',   desc: 'Read & write tags' },
    { label: 'GPS speed',           route: '/hw/speed',         icon: '🛰', color: 'from-cyan-500 to-sky-600',      desc: 'Live speedometer' },
    { label: 'Shake dice',          route: '/hw/shake',         icon: '🎲', color: 'from-amber-500 to-orange-600',  desc: 'Motion roll' },
    { label: 'P2P transfer',        route: '/hw/p2p',           icon: '📲', color: 'from-emerald-500 to-teal-600',  desc: 'Peer-to-peer files' },
  ]},
  { label: 'Live', cols: 2, align: 'right', items: [
    { label: 'Currency',       route: '/currency', icon: '$', color: 'from-green-500 to-emerald-600',  desc: 'Live FX rates' },
    { label: 'Crypto',         route: '/crypto',   icon: '₿', color: 'from-yellow-500 to-orange-500',  desc: 'Top 100 coins' },
    { label: 'Weather',        route: '/weather',  icon: '☀', color: 'from-cyan-500 to-sky-600',       desc: '7-day forecast' },
    { label: 'Country info',   route: '/country',  icon: '🌍', color: 'from-emerald-500 to-cyan-600',  desc: '250 countries' },
    { label: 'IP lookup',      route: '/ip',       icon: '🌐', color: 'from-sky-500 to-indigo-600',    desc: 'Geolocate' },
    { label: 'Holidays',       route: '/holidays', icon: '🎉', color: 'from-pink-500 to-rose-600',     desc: '18+ countries' },
  ]},
];

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  template: `
    <header class="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/60 dark:border-slate-800/60">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a routerLink="/" class="flex items-center gap-2.5 group">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-indigo-500 to-fuchsia-500 grid place-items-center text-white font-black text-lg shadow-glow group-hover:scale-110 transition">T</div>
          <div class="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white">Toolverse</div>
        </a>

        <div class="hidden md:flex items-center gap-1">
          @for (g of groups; track g.label) {
            <div class="relative" (mouseenter)="hover.set(g.label)" (mouseleave)="hover.set('')">
              <button class="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-300 rounded-lg transition flex items-center gap-1"
                      [class.!text-brand-600]="hover() === g.label"
                      [class.dark:!text-brand-300]="hover() === g.label">
                {{ g.label }}
                <svg class="w-3 h-3 transition-transform" [class.rotate-180]="hover() === g.label" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              @if (hover() === g.label) {
                <div class="absolute top-full pt-2 z-50"
                     [class.left-0]="g.align !== 'right'"
                     [class.right-0]="g.align === 'right'"
                     style="animation: nav-pop 0.18s ease-out both;">
                  <div class="card p-2 shadow-glow border border-slate-200/80 dark:border-slate-700/80"
                       [style.width.px]="g.cols === 3 ? 480 : g.cols === 2 ? 340 : 220">
                    <div class="grid gap-0.5"
                         [class.grid-cols-1]="!g.cols || g.cols === 1"
                         [class.grid-cols-2]="g.cols === 2"
                         [class.grid-cols-3]="g.cols === 3">
                      @for (item of g.items; track item.route; let i = $index) {
                        <a [routerLink]="item.route"
                           routerLinkActive="!bg-brand-50 dark:!bg-brand-950/60"
                           class="nav-item group/item flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 transition"
                           [style.animationDelay.ms]="i * 15">
                          <div class="w-6 h-6 rounded-md bg-gradient-to-br {{ item.color }} grid place-items-center text-white text-[11px] shadow-sm shrink-0 group-hover/item:scale-110 group-hover/item:rotate-3 transition">{{ item.icon }}</div>
                          <span class="text-[12px] font-medium text-slate-700 dark:text-slate-200 truncate leading-tight">{{ item.label }}</span>
                        </a>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <div class="flex items-center gap-2">
          <button (click)="theme.toggle()" class="w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition" aria-label="Toggle theme">
            @if (theme.isDark()) {
              <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0l.7.7a1 1 0 01-1.41 1.42l-.71-.71a1 1 0 010-1.41zM13.66 13.66a1 1 0 011.41 0l.71.71a1 1 0 01-1.41 1.41l-.71-.7a1 1 0 010-1.42zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM15 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM4.22 15.78a1 1 0 010-1.41l.71-.71a1 1 0 011.41 1.41l-.7.71a1 1 0 01-1.42 0zM13.66 6.34a1 1 0 010-1.41l.71-.71a1 1 0 111.41 1.41l-.7.71a1 1 0 01-1.42 0zM10 6a4 4 0 100 8 4 4 0 000-8z"/></svg>
            } @else {
              <svg class="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
            }
          </button>
          <button (click)="open.set(!open())" class="md:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Menu">
            <svg class="w-6 h-6 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </nav>

    </header>

    <!-- MOBILE DRAWER -->
    @if (open()) {
      <div class="md:hidden fixed inset-0 z-50" (click)="closeDrawer()">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" style="animation: drawer-fade 0.2s ease-out both;"></div>

        <!-- Drawer (right side) -->
        <aside class="absolute top-0 right-0 h-full w-[85vw] max-w-[360px] bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
               style="animation: drawer-slide 0.25s ease-out both;"
               (click)="$event.stopPropagation()">

          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 via-indigo-500 to-fuchsia-500 grid place-items-center text-white font-black text-sm">T</div>
              <span class="font-display font-bold text-base">Toolverse</span>
            </div>
            <button (click)="closeDrawer()" class="w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close menu">
              <svg class="w-5 h-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <!-- Search -->
          <div class="px-3 py-3 border-b border-slate-200 dark:border-slate-800">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="search"
                     class="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 outline-none"
                     placeholder="Search menu…"
                     [(ngModel)]="search" />
            </div>
          </div>

          <!-- Groups -->
          <nav class="flex-1 overflow-y-auto px-2 py-2">
            @if (search().trim()) {
              <div class="space-y-0.5">
                @for (item of searchResults(); track item.route) {
                  <a [routerLink]="item.route" (click)="closeDrawer()"
                     class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                    <div class="w-7 h-7 rounded-md bg-gradient-to-br {{ item.color }} grid place-items-center text-white text-xs shadow-sm shrink-0">{{ item.icon }}</div>
                    <span class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{{ item.label }}</span>
                  </a>
                }
                @if (searchResults().length === 0) {
                  <div class="text-center py-8 text-sm text-slate-500">No tools match "{{ search() }}"</div>
                }
              </div>
            } @else {
              @for (g of groups; track g.label) {
                <div class="mb-1">
                  <button class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          (click)="toggleGroup(g.label)">
                    <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">{{ g.label }}</span>
                    <svg class="w-4 h-4 text-slate-400 transition-transform"
                         [class.rotate-180]="expanded() === g.label"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  @if (expanded() === g.label) {
                    <div class="ml-2 mt-0.5 mb-1 pl-3 border-l-2 border-slate-200 dark:border-slate-800 space-y-0.5" style="animation: drawer-expand 0.2s ease-out both;">
                      @for (item of g.items; track item.route) {
                        <a [routerLink]="item.route" (click)="closeDrawer()"
                           routerLinkActive="!bg-brand-50 dark:!bg-brand-950/60 !text-brand-700 dark:!text-brand-300"
                           class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                          <div class="w-6 h-6 rounded-md bg-gradient-to-br {{ item.color }} grid place-items-center text-white text-[10px] shadow-sm shrink-0">{{ item.icon }}</div>
                          <span class="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{{ item.label }}</span>
                        </a>
                      }
                    </div>
                  }
                </div>
              }
            }
          </nav>

          <!-- Footer -->
          <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center">
            100% client-side · No tracking
          </div>
        </aside>
      </div>
    }
  `,
  styles: [`
    @keyframes nav-pop {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes nav-item-in {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes drawer-fade {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes drawer-slide {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    @keyframes drawer-expand {
      from { opacity: 0; max-height: 0; }
      to   { opacity: 1; max-height: 1000px; }
    }
    .nav-item { animation: nav-item-in 0.28s ease-out both; }
  `],
})
export class Navbar {
  protected theme = inject(ThemeService);
  protected open = signal(false);
  protected hover = signal('');
  protected expanded = signal('');
  protected search = signal('');
  protected groups = GROUPS;

  protected searchResults = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return [];
    const out: Item[] = [];
    for (const g of this.groups) {
      for (const it of g.items) {
        if (it.label.toLowerCase().includes(q) || (it.desc?.toLowerCase().includes(q) ?? false)) {
          out.push(it);
        }
      }
    }
    return out.slice(0, 30);
  });

  toggleGroup(label: string) {
    this.expanded.set(this.expanded() === label ? '' : label);
  }

  closeDrawer() {
    this.open.set(false);
    this.search.set('');
    this.expanded.set('');
  }
}
