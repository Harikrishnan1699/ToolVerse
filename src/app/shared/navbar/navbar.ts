import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../theme.service';

interface Group { label: string; items: { label: string; route: string }[]; }

const GROUPS: Group[] = [
  { label: 'PDF', items: [
    { label: 'All PDF tools', route: '/pdf' },
    { label: 'Merge', route: '/pdf/merge' }, { label: 'Split', route: '/pdf/split' },
    { label: 'Compress', route: '/pdf/compress' }, { label: 'Sign', route: '/pdf/sign' },
    { label: 'Redact', route: '/pdf/redact' }, { label: 'Watermark', route: '/pdf/watermark' },
  ]},
  { label: 'Image', items: [
    { label: 'All image tools', route: '/image' },
    { label: 'Compress', route: '/image/compress' }, { label: 'Resize', route: '/image/resize' },
    { label: 'OCR (image to text)', route: '/image/ocr' }, { label: 'Background remover', route: '/image/background-remove' },
    { label: 'Favicon generator', route: '/image/favicon' }, { label: 'Meme generator', route: '/image/meme' },
  ]},
  { label: 'Media', items: [
    { label: 'All media tools', route: '/media' },
    { label: 'Video to GIF', route: '/media/video-to-gif' }, { label: 'Compress video', route: '/media/video-compress' },
    { label: 'Audio converter', route: '/media/audio-convert' },
  ]},
  { label: 'Dev', items: [
    { label: 'All dev tools', route: '/dev' },
    { label: 'JSON formatter', route: '/dev/json' }, { label: 'Hash generator', route: '/dev/hash' },
    { label: 'JWT decoder', route: '/dev/jwt' }, { label: 'Regex tester', route: '/dev/regex' },
    { label: 'Gradient generator', route: '/dev/gradient' },
  ]},
  { label: 'More', items: [
    { label: 'Text tools', route: '/text' }, { label: 'Markdown', route: '/text/markdown' },
    { label: 'Translator', route: '/text/translate' },
    { label: 'Calculators', route: '/calc' }, { label: 'QR generator', route: '/qr/generator' },
    { label: 'QR scanner', route: '/qr/scanner' }, { label: 'Password tools', route: '/security/password' },
    { label: 'AES encrypt', route: '/security/aes' }, { label: 'Fake data', route: '/security/faker' },
    { label: 'Gzip / Deflate', route: '/dev/compress-text' },
    { label: 'Productivity', route: '/productivity' }, { label: 'Meta generator', route: '/seo/meta' },
    { label: 'robots/sitemap', route: '/seo/robots' },
  ]},
  { label: 'Hardware', items: [
    { label: 'NFC reader/writer', route: '/hw/nfc' },
    { label: 'GPS speed', route: '/hw/speed' },
    { label: 'Shake dice', route: '/hw/shake' },
    { label: 'P2P file transfer', route: '/hw/p2p' },
  ]},
  { label: 'Live', items: [
    { label: 'Currency', route: '/currency' }, { label: 'Crypto', route: '/crypto' },
    { label: 'Weather', route: '/weather' }, { label: 'Country info', route: '/country' },
    { label: 'IP lookup', route: '/ip' }, { label: 'Public holidays', route: '/holidays' },
  ]},
];

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
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
              <button class="px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-300 rounded-lg transition flex items-center gap-1">
                {{ g.label }}
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </button>
              @if (hover() === g.label) {
                <div class="absolute top-full left-0 pt-1 z-50">
                  <div class="card p-2 min-w-[220px] shadow-glow">
                    @for (item of g.items; track item.route) {
                      <a [routerLink]="item.route" routerLinkActive="bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300" class="block px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">{{ item.label }}</a>
                    }
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

      @if (open()) {
        <div class="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-3 space-y-2 max-h-[70vh] overflow-y-auto">
          @for (g of groups; track g.label) {
            <div>
              <div class="text-xs font-semibold text-slate-500 uppercase mt-2 mb-1">{{ g.label }}</div>
              @for (item of g.items; track item.route) {
                <a [routerLink]="item.route" (click)="open.set(false)" class="block px-3 py-1.5 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">{{ item.label }}</a>
              }
            </div>
          }
        </div>
      }
    </header>
  `,
})
export class Navbar {
  protected theme = inject(ThemeService);
  protected open = signal(false);
  protected hover = signal('');
  protected groups = GROUPS;
}
