import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { faker } from '@faker-js/faker';
import { saveAs } from 'file-saver';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-sec-faker',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Fake Data Generator" subtitle="Generate realistic fake names, emails, addresses and more for testing." icon="👤" color="from-pink-500 to-rose-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-6 space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div><label class="text-xs font-medium">Rows</label><input type="number" min="1" max="500" class="input mt-1" [(ngModel)]="count" /></div>
          <div><label class="text-xs font-medium">Locale</label>
            <select class="input mt-1" [(ngModel)]="locale">
              <option value="en">English</option><option value="en_IN">English (India)</option>
              <option value="fr">French</option><option value="de">German</option><option value="es">Spanish</option>
              <option value="it">Italian</option><option value="ja">Japanese</option><option value="zh_CN">Chinese</option>
            </select>
          </div>
          <div class="col-span-2 self-end"><button class="btn-primary w-full" (click)="gen()">Generate</button></div>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.name" /> Name</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.email" /> Email</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.phone" /> Phone</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.address" /> Address</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.city" /> City</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.country" /> Country</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.company" /> Company</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.job" /> Job</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.dob" /> Date of birth</label>
          <label class="flex items-center gap-1"><input type="checkbox" [(ngModel)]="cols.uuid" /> UUID</label>
        </div>
        @if (rows().length) {
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="text-slate-500"><tr>@for (h of headers(); track h) { <th class="text-left p-2">{{ h }}</th> }</tr></thead>
              <tbody>
                @for (r of rows(); track $index) {
                  <tr class="border-t border-slate-100 dark:border-slate-800">@for (h of headers(); track h) { <td class="p-2">{{ r[h] }}</td> }</tr>
                }
              </tbody>
            </table>
          </div>
          <div class="flex gap-2">
            <button class="btn-secondary text-xs" (click)="dl('csv')">Download CSV</button>
            <button class="btn-secondary text-xs" (click)="dl('json')">Download JSON</button>
          </div>
        }
      </div>
    </section>
  `,
})
export class SecFaker {
  protected count = 25; protected locale = 'en';
  protected cols = { name: true, email: true, phone: true, address: false, city: true, country: false, company: false, job: false, dob: false, uuid: false };
  protected rows = signal<Record<string, string>[]>([]);

  headers() { return (Object.keys(this.cols) as (keyof typeof this.cols)[]).filter(k => this.cols[k]); }

  async gen() {
    const out: Record<string, string>[] = [];
    for (let i = 0; i < +this.count; i++) {
      const r: Record<string, string> = {};
      if (this.cols.name) r['name'] = faker.person.fullName();
      if (this.cols.email) r['email'] = faker.internet.email();
      if (this.cols.phone) r['phone'] = faker.phone.number();
      if (this.cols.address) r['address'] = faker.location.streetAddress();
      if (this.cols.city) r['city'] = faker.location.city();
      if (this.cols.country) r['country'] = faker.location.country();
      if (this.cols.company) r['company'] = faker.company.name();
      if (this.cols.job) r['job'] = faker.person.jobTitle();
      if (this.cols.dob) r['dob'] = faker.date.birthdate().toISOString().slice(0, 10);
      if (this.cols.uuid) r['uuid'] = faker.string.uuid();
      out.push(r);
    }
    this.rows.set(out);
  }

  dl(fmt: 'csv' | 'json') {
    if (fmt === 'csv') {
      const h = this.headers();
      const csv = [h.join(','), ...this.rows().map(r => h.map(k => `"${(r[k] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
      saveAs(new Blob([csv], { type: 'text/csv' }), 'fake-data.csv');
    } else {
      saveAs(new Blob([JSON.stringify(this.rows(), null, 2)], { type: 'application/json' }), 'fake-data.json');
    }
  }
}
