import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { SectionHeader } from '../../shared/section-header/section-header';

interface Rule { agent: string; allow: string; disallow: string; }

@Component({
  selector: 'app-seo-robots',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="robots.txt + Sitemap" subtitle="Generate a robots.txt and a basic sitemap.xml in seconds." icon="🤖" color="from-slate-600 to-slate-800" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-2 flex gap-1">
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === 'robots'" (click)="tab.set('robots')">robots.txt</button>
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === 'sitemap'" (click)="tab.set('sitemap')">sitemap.xml</button>
      </div>

      @if (tab() === 'robots') {
        <div class="card p-6 space-y-4">
          <div>
            <label class="text-sm font-medium">Sitemap URL</label>
            <input class="input mt-1" [(ngModel)]="sitemap" placeholder="https://example.com/sitemap.xml" />
          </div>
          @for (r of rules(); track $index; let i = $index) {
            <div class="grid grid-cols-3 gap-2 items-end">
              <div><label class="text-xs">User-agent</label><input class="input mt-1" [(ngModel)]="r.agent" /></div>
              <div><label class="text-xs">Allow</label><input class="input mt-1" [(ngModel)]="r.allow" placeholder="/" /></div>
              <div class="flex gap-2"><div class="flex-1"><label class="text-xs">Disallow</label><input class="input mt-1" [(ngModel)]="r.disallow" placeholder="/admin/" /></div><button class="btn-ghost text-rose-600" (click)="removeRule(i)">×</button></div>
            </div>
          }
          <button class="btn-secondary text-xs" (click)="addRule()">+ Add rule</button>
          <pre class="font-mono text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 whitespace-pre-wrap">{{ robots() }}</pre>
          <div class="flex gap-2">
            <button class="btn-primary" (click)="copy(robots())">Copy</button>
            <button class="btn-secondary" (click)="dl('robots.txt', robots(), 'text/plain')">Download</button>
          </div>
        </div>
      } @else {
        <div class="card p-6 space-y-4">
          <div><label class="text-sm font-medium">Base URL</label><input class="input mt-1" [(ngModel)]="base" /></div>
          <div><label class="text-sm font-medium">URLs (one per line)</label><textarea class="input mt-1 font-mono text-xs h-48" [(ngModel)]="urls" placeholder="/&#10;/about&#10;/blog/post-1"></textarea></div>
          <pre class="font-mono text-xs bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 max-h-72 overflow-auto whitespace-pre-wrap">{{ sitemapXml() }}</pre>
          <div class="flex gap-2">
            <button class="btn-primary" (click)="copy(sitemapXml())">Copy</button>
            <button class="btn-secondary" (click)="dl('sitemap.xml', sitemapXml(), 'application/xml')">Download</button>
          </div>
        </div>
      }
    </section>
  `,
})
export class SeoRobots {
  protected tab = signal<'robots' | 'sitemap'>('robots');
  protected sitemap = 'https://example.com/sitemap.xml';
  protected rules = signal<Rule[]>([{ agent: '*', allow: '/', disallow: '' }]);
  protected base = 'https://example.com';
  protected urls = '/\n/about\n/contact';

  addRule() { this.rules.update(r => [...r, { agent: '*', allow: '', disallow: '' }]); }
  removeRule(i: number) { this.rules.update(r => r.filter((_, idx) => idx !== i)); }

  robots() {
    let out = '';
    this.rules().forEach(r => {
      out += `User-agent: ${r.agent}\n`;
      if (r.allow) out += `Allow: ${r.allow}\n`;
      if (r.disallow) out += `Disallow: ${r.disallow}\n`;
      out += '\n';
    });
    if (this.sitemap) out += `Sitemap: ${this.sitemap}\n`;
    return out;
  }

  sitemapXml() {
    const today = new Date().toISOString().slice(0, 10);
    const urls = this.urls.split('\n').filter(l => l.trim()).map(p => p.trim());
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    urls.forEach(p => {
      const full = this.base.replace(/\/$/, '') + (p.startsWith('/') ? p : '/' + p);
      xml += `  <url>\n    <loc>${full}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });
    xml += '</urlset>';
    return xml;
  }

  async copy(s: string) { try { await navigator.clipboard.writeText(s); } catch {} }
  dl(name: string, content: string, mime: string) { saveAs(new Blob([content], { type: mime }), name); }
}
