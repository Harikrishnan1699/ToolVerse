import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-ip-lookup',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="IP Address Lookup" subtitle="See your IP and detailed info for any IP address (geolocation, ISP, timezone)." icon="🌐" color="from-sky-500 to-indigo-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-6 space-y-3">
        <div class="flex gap-2">
          <input class="input" placeholder="Leave blank for your own IP, or enter any IP / domain" [(ngModel)]="ip" />
          <button class="btn-primary" (click)="lookup()" [disabled]="loading()">
            @if (loading()) { Looking up… } @else { Lookup }
          </button>
        </div>
        @if (info()) {
          <dl class="grid sm:grid-cols-2 gap-3 text-sm pt-3">
            @for (row of rows(); track row.k) {
              <div class="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3">
                <dt class="text-xs text-slate-500 uppercase tracking-wider">{{ row.k }}</dt>
                <dd class="font-semibold mt-1">{{ row.v }}</dd>
              </div>
            }
          </dl>
        }
        @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
      </div>
    </section>
  `,
})
export class IpLookup implements OnInit {
  private http = inject(HttpClient);
  protected ip = '';
  protected info = signal<any>(null);
  protected loading = signal(false);
  protected error = signal('');

  ngOnInit() { this.lookup(); }

  rows() {
    const i = this.info(); if (!i) return [];
    return [
      { k: 'IP', v: i.ip },
      { k: 'Type', v: i.version },
      { k: 'City', v: i.city },
      { k: 'Region', v: i.region },
      { k: 'Country', v: `${i.country_name} (${i.country_code})` },
      { k: 'Postal code', v: i.postal },
      { k: 'Latitude / Longitude', v: `${i.latitude}, ${i.longitude}` },
      { k: 'Timezone', v: i.timezone },
      { k: 'ISP / Org', v: i.org ?? '—' },
      { k: 'ASN', v: i.asn ?? '—' },
      { k: 'Currency', v: `${i.currency_name} (${i.currency})` },
    ].filter(r => r.v !== undefined && r.v !== '');
  }

  async lookup() {
    this.loading.set(true); this.error.set('');
    try {
      const url = this.ip.trim() ? `https://ipapi.co/${this.ip.trim()}/json/` : 'https://ipapi.co/json/';
      const res = await firstValueFrom(this.http.get<any>(url));
      if (res.error) throw new Error(res.reason ?? 'Lookup failed');
      this.info.set(res);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Lookup failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
