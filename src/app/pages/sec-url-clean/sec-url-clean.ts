import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

const TRACKERS = [
  // UTM
  /^utm_/i,
  // Facebook
  /^fbclid$/i, /^fb_action_/i, /^fb_ref$/i, /^fb_source$/i,
  // Google
  /^gclid$/i, /^gclsrc$/i, /^dclid$/i, /^_ga$/i, /^_gl$/i, /^ga_/i, /^aclk$/i,
  // Mailchimp
  /^mc_eid$/i, /^mc_cid$/i,
  // HubSpot
  /^_hsenc$/i, /^_hsmi$/i, /^__hstc$/i, /^__hssc$/i, /^__hsfp$/i, /^hsCtaTracking$/i,
  // Microsoft
  /^msclkid$/i,
  // Twitter / X
  /^twclid$/i, /^s$/i, /^t$/i, // s/t on twitter share URLs
  // YouTube
  /^si$/i, /^feature$/i,
  // Generic ref
  /^ref(_url|_src)?$/i, /^source$/i,
  // Twitter t
  /^igshid$/i, // Instagram
  /^vero_id$/i, /^vero_conv$/i,
  /^mkt_tok$/i, // Marketo
  /^pk_(campaign|kwd|medium|source|content)$/i, // Matomo/Piwik
  /^yclid$/i, // Yandex
  /^trk$/i, /^trkCampaign$/i, // LinkedIn
];

@Component({
  selector: 'app-sec-url-clean',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="URL Tracker Cleaner" subtitle="Strip utm, fbclid, gclid and 30+ other trackers before you share a link." icon="🧹" color="from-emerald-500 to-teal-600" back="/" backLabel="Home" />
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">

      <div class="card p-5 space-y-3">
        <label class="text-sm font-medium">Paste URL</label>
        <textarea class="input font-mono text-xs h-24" placeholder="https://example.com/?utm_source=twitter&fbclid=…" [(ngModel)]="src" (ngModelChange)="run()"></textarea>
        <div class="flex gap-2">
          <button class="btn-secondary text-sm" (click)="paste()">Paste</button>
          <button class="btn-secondary text-sm" (click)="src = ''; run()">Clear</button>
          <span class="flex-1"></span>
          <button class="btn-primary text-sm" (click)="copy()" [disabled]="!cleaned()">Copy cleaned</button>
        </div>
      </div>

      @if (error()) {
        <div class="card p-3 text-sm text-rose-600 border-rose-200">⚠ {{ error() }}</div>
      } @else if (cleaned()) {
        <div class="card p-5">
          <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Cleaned URL</div>
          <div class="font-mono text-sm break-all p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">{{ cleaned() }}</div>
          <div class="text-xs text-slate-500 mt-2">
            Removed {{ removed().length }} tracker(s){{ removed().length ? ': ' : '' }}
            @for (r of removed(); track r; let last = $last) {
              <span class="font-mono text-rose-600">{{ r }}</span>@if (!last) { , }
            }
          </div>
        </div>
      }

      <div class="card p-5">
        <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">What gets removed</div>
        <ul class="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
          <li>utm_*</li><li>fbclid</li><li>gclid</li><li>gclsrc</li><li>dclid</li><li>msclkid</li>
          <li>mc_eid / mc_cid</li><li>_hsenc / _hsmi</li><li>__hstc / __hssc</li><li>yclid</li>
          <li>vero_*</li><li>mkt_tok</li><li>pk_* (Matomo)</li><li>igshid</li><li>twclid</li>
        </ul>
      </div>
    </section>
  `,
})
export class SecUrlClean {
  protected src = 'https://example.com/article?id=42&utm_source=newsletter&utm_medium=email&fbclid=IwAR123';
  protected cleaned = signal('');
  protected removed = signal<string[]>([]);
  protected error = signal('');

  constructor(private toast: ToastService) { this.run(); }

  run() {
    this.error.set('');
    if (!this.src.trim()) { this.cleaned.set(''); this.removed.set([]); return; }
    try {
      const u = new URL(this.src.trim());
      const removed: string[] = [];
      const keep: [string, string][] = [];
      u.searchParams.forEach((v, k) => {
        if (TRACKERS.some(re => re.test(k))) removed.push(k);
        else keep.push([k, v]);
      });
      u.search = '';
      keep.forEach(([k, v]) => u.searchParams.append(k, v));
      // remove tracking fragment too
      if (/^(utm_|fbclid|gclid)/i.test(u.hash.replace(/^#/, ''))) u.hash = '';
      this.cleaned.set(u.toString());
      this.removed.set(removed);
    } catch (e: any) {
      this.error.set('Invalid URL');
      this.cleaned.set('');
    }
  }

  async paste() { try { this.src = await navigator.clipboard.readText(); this.run(); } catch {} }
  async copy() { try { await navigator.clipboard.writeText(this.cleaned()); this.toast.success('Copied cleaned URL'); } catch {} }
}
