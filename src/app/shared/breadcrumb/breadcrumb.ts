import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { TOOLS } from '../tools';

interface Crumb { label: string; url: string; isLast?: boolean; }

const SECTION_LABELS: Record<string, string> = {
  pdf: 'PDF Tools',
  image: 'Image Tools',
  media: 'Audio & Video',
  dev: 'Developer Tools',
  text: 'Text Tools',
  calc: 'Calculators',
  qr: 'QR & Codes',
  security: 'Security',
  productivity: 'Productivity',
  seo: 'SEO',
  hw: 'Hardware',
  currency: 'Currency',
  crypto: 'Cryptocurrency',
  weather: 'Weather',
  country: 'Country Info',
  ip: 'IP Lookup',
  holidays: 'Public Holidays',
  settings: 'Settings',
  share: 'Receive share',
  open: 'Open file',
};

const SECTION_ROUTE: Record<string, string> = {
  pdf: '/pdf', image: '/image', media: '/media', dev: '/dev',
  text: '/text', calc: '/calc', qr: '/qr/generator', security: '/security/password',
  productivity: '/productivity', seo: '/seo/meta', hw: '/hw/nfc',
};

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  template: `
    @if (crumbs().length > 1) {
      <nav class="border-b border-slate-100 dark:border-slate-800/60 bg-white/40 dark:bg-slate-950/40 backdrop-blur-sm" aria-label="Breadcrumb">
        <ol class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-1.5 text-sm overflow-x-auto whitespace-nowrap">
          @for (c of crumbs(); track c.url; let i = $index; let last = $last) {
            <li class="flex items-center gap-1.5">
              @if (i > 0) {
                <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              }
              @if (last) {
                <span class="text-slate-900 dark:text-white font-medium truncate max-w-[40ch]">{{ c.label }}</span>
              } @else {
                <a [routerLink]="c.url" class="text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 truncate max-w-[24ch] inline-flex items-center gap-1">
                  @if (i === 0) {
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                  }
                  {{ c.label }}
                </a>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
})
export class Breadcrumb {
  private router = inject(Router);
  protected crumbs = signal<Crumb[]>([]);

  constructor() {
    this.build(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.build(e.urlAfterRedirects);
    });
  }

  private build(url: string) {
    const path = (url.split('?')[0] || '/').replace(/\/+$/, '') || '/';
    if (path === '/' || path === '') { this.crumbs.set([]); return; }

    const segments = path.split('/').filter(Boolean);
    const out: Crumb[] = [{ label: 'Home', url: '/' }];

    // Try tool registry — gives prettiest labels
    const tool = TOOLS.find(t => t.route === path);

    if (segments.length === 1) {
      const seg = segments[0];
      out.push({ label: tool?.name ?? SECTION_LABELS[seg] ?? this.titleCase(seg), url: path });
    } else if (segments.length >= 2) {
      const section = segments[0];
      out.push({ label: SECTION_LABELS[section] ?? this.titleCase(section), url: SECTION_ROUTE[section] ?? '/' + section });
      const leafLabel = tool?.name ?? this.titleCase(segments.slice(1).join(' '));
      out.push({ label: leafLabel, url: path });
    }

    this.crumbs.set(out);
  }

  private titleCase(s: string): string {
    return s.replace(/[-_/]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
