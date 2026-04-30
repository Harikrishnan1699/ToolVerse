import { Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-seo-meta',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Meta Tag Generator" subtitle="Generate SEO + Open Graph + Twitter card meta tags with live previews." icon="🏷" color="from-blue-500 to-cyan-600" />
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-2 gap-5">
      <div class="card p-6 space-y-3">
        <div><label class="text-xs font-medium">Title</label><input class="input mt-1" [(ngModel)]="title" /></div>
        <div><label class="text-xs font-medium">Description</label><textarea class="input mt-1 h-20" [(ngModel)]="desc"></textarea></div>
        <div><label class="text-xs font-medium">URL</label><input class="input mt-1" [(ngModel)]="url" /></div>
        <div><label class="text-xs font-medium">Image URL</label><input class="input mt-1" [(ngModel)]="image" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-medium">Site name</label><input class="input mt-1" [(ngModel)]="site" /></div>
          <div><label class="text-xs font-medium">Twitter @</label><input class="input mt-1" [(ngModel)]="twitter" /></div>
        </div>
        <div><label class="text-xs font-medium">Keywords</label><input class="input mt-1" [(ngModel)]="keywords" /></div>
        <div class="font-mono text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 max-h-72 overflow-auto whitespace-pre-wrap">{{ output() }}</div>
        <button class="btn-primary w-full" (click)="copy()">Copy all tags</button>
      </div>
      <div class="space-y-4">
        <div class="card p-4 space-y-2">
          <div class="text-xs font-semibold text-slate-500 uppercase">Google preview</div>
          <div class="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <div class="text-xs text-slate-500 truncate">{{ url || 'https://example.com' }}</div>
            <div class="text-blue-600 dark:text-blue-400 text-base font-medium truncate">{{ title || 'Page title' }}</div>
            <div class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{{ desc || 'Page description shows here.' }}</div>
          </div>
        </div>
        <div class="card p-4 space-y-2">
          <div class="text-xs font-semibold text-slate-500 uppercase">Open Graph (Facebook/LinkedIn)</div>
          <div class="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            @if (image) { <img [src]="image" class="w-full aspect-[1.91/1] object-cover" /> } @else { <div class="aspect-[1.91/1] bg-slate-100 dark:bg-slate-800 grid place-items-center text-xs text-slate-400">og:image preview</div> }
            <div class="p-3">
              <div class="text-[10px] uppercase text-slate-500">{{ host() }}</div>
              <div class="font-medium truncate">{{ title || 'Page title' }}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{{ desc }}</div>
            </div>
          </div>
        </div>
        <div class="card p-4 space-y-2">
          <div class="text-xs font-semibold text-slate-500 uppercase">Twitter card</div>
          <div class="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            @if (image) { <img [src]="image" class="w-full aspect-[1.91/1] object-cover" /> } @else { <div class="aspect-[1.91/1] bg-slate-100 dark:bg-slate-800 grid place-items-center text-xs text-slate-400">twitter:image preview</div> }
            <div class="p-3 text-sm">
              <div class="font-medium truncate">{{ title }}</div>
              <div class="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{{ desc }}</div>
              <div class="text-xs text-slate-400 mt-1">{{ host() }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SeoMeta {
  protected title = 'Toolverse — All-in-one toolkit';
  protected desc = 'PDF, image, audio, video, developer & live-data tools — fast, private, fully in-browser.';
  protected url = 'https://toolverse.app';
  protected image = '';
  protected site = 'Toolverse';
  protected twitter = '@toolverse';
  protected keywords = 'pdf tools, image converter, qr generator, json formatter';

  host() { try { return new URL(this.url).host; } catch { return ''; } }

  protected output = computed(() => {
    const t = this.title, d = this.desc, u = this.url, i = this.image, s = this.site, tw = this.twitter, k = this.keywords;
    return `<title>${t}</title>
<meta name="description" content="${d}">
<meta name="keywords" content="${k}">
<link rel="canonical" href="${u}">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:url" content="${u}">
<meta property="og:image" content="${i}">
<meta property="og:site_name" content="${s}">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
<meta name="twitter:site" content="${tw}">`;
  });

  async copy() { try { await navigator.clipboard.writeText(this.output()); } catch {} }
}
