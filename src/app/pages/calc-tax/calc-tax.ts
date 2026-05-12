import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SectionHeader } from '../../shared/section-header/section-header';

type Tab = 'tax-in' | 'sip' | 'lumpsum' | 'fd' | 'tax-us';

@Component({
  selector: 'app-calc-tax',
  imports: [FormsModule, CommonModule, SectionHeader],
  template: `
    <app-section-header title="Tax & Investment Calculators" subtitle="Income tax (India / US), SIP, lumpsum, FD — all in one place." icon="₹$" color="from-emerald-500 to-green-600" back="/" backLabel="Home" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">
      <div class="card p-2 flex flex-wrap gap-1">
        @for (t of tabs; track t.id) {
          <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
        }
      </div>

      @switch (tab()) {

        @case ('tax-in') {
          <div class="card p-6 space-y-4">
            <div class="grid sm:grid-cols-3 gap-3">
              <div><label class="text-sm">Gross income (₹)</label><input type="number" class="input mt-1" [(ngModel)]="inGross" /></div>
              <div><label class="text-sm">Standard deduction (₹)</label><input type="number" class="input mt-1" [(ngModel)]="inStd" /></div>
              <div><label class="text-sm">Regime</label>
                <select class="input mt-1" [(ngModel)]="inRegime">
                  <option value="new">New (FY 2025-26)</option>
                  <option value="old">Old</option>
                </select>
              </div>
            </div>
            @if (inRegime === 'old') {
              <div class="grid sm:grid-cols-3 gap-3">
                <div><label class="text-sm">80C investments</label><input type="number" class="input mt-1" [(ngModel)]="inC80c" /></div>
                <div><label class="text-sm">80D (health)</label><input type="number" class="input mt-1" [(ngModel)]="inC80d" /></div>
                <div><label class="text-sm">Home loan interest</label><input type="number" class="input mt-1" [(ngModel)]="inHomeLoan" /></div>
              </div>
            }
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="card p-4"><div class="text-xs text-slate-500">Taxable income</div><div class="text-xl font-bold mt-1">₹{{ taxIn().taxable | number:'1.0-0' }}</div></div>
              <div class="card p-4"><div class="text-xs text-slate-500">Income tax</div><div class="text-xl font-bold mt-1 text-rose-600">₹{{ taxIn().tax | number:'1.0-0' }}</div></div>
              <div class="card p-4"><div class="text-xs text-slate-500">Cess (4%)</div><div class="text-xl font-bold mt-1">₹{{ taxIn().cess | number:'1.0-0' }}</div></div>
              <div class="card p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"><div class="text-xs text-emerald-700 dark:text-emerald-300">Take-home</div><div class="text-xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">₹{{ taxIn().net | number:'1.0-0' }}</div></div>
            </div>
            <div class="text-xs text-slate-500">Effective rate: {{ taxIn().rate | number:'1.2-2' }}% · Monthly take-home: ₹{{ taxIn().monthly | number:'1.0-0' }}</div>
          </div>
        }

        @case ('sip') {
          <div class="card p-6 space-y-4">
            <div class="grid sm:grid-cols-3 gap-3">
              <div><label class="text-sm">Monthly investment</label><input type="number" class="input mt-1" [(ngModel)]="sipMonthly" /></div>
              <div><label class="text-sm">Expected return % (yearly)</label><input type="number" step="0.1" class="input mt-1" [(ngModel)]="sipReturn" /></div>
              <div><label class="text-sm">Duration (years)</label><input type="number" class="input mt-1" [(ngModel)]="sipYears" /></div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="card p-4"><div class="text-xs text-slate-500">Invested</div><div class="text-xl font-bold mt-1">₹{{ sip().invested | number:'1.0-0' }}</div></div>
              <div class="card p-4"><div class="text-xs text-slate-500">Returns</div><div class="text-xl font-bold mt-1 text-emerald-600">₹{{ sip().gains | number:'1.0-0' }}</div></div>
              <div class="card p-4 bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900"><div class="text-xs text-brand-700 dark:text-brand-300">Maturity</div><div class="text-xl font-bold mt-1 text-brand-700 dark:text-brand-300">₹{{ sip().total | number:'1.0-0' }}</div></div>
            </div>
          </div>
        }

        @case ('lumpsum') {
          <div class="card p-6 space-y-4">
            <div class="grid sm:grid-cols-3 gap-3">
              <div><label class="text-sm">Lumpsum amount</label><input type="number" class="input mt-1" [(ngModel)]="lsAmt" /></div>
              <div><label class="text-sm">Expected return %</label><input type="number" step="0.1" class="input mt-1" [(ngModel)]="lsReturn" /></div>
              <div><label class="text-sm">Years</label><input type="number" class="input mt-1" [(ngModel)]="lsYears" /></div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="card p-4"><div class="text-xs text-slate-500">Invested</div><div class="text-xl font-bold mt-1">₹{{ lump().invested | number:'1.0-0' }}</div></div>
              <div class="card p-4"><div class="text-xs text-slate-500">Returns</div><div class="text-xl font-bold mt-1 text-emerald-600">₹{{ lump().gains | number:'1.0-0' }}</div></div>
              <div class="card p-4 bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900"><div class="text-xs text-brand-700 dark:text-brand-300">Maturity</div><div class="text-xl font-bold mt-1 text-brand-700 dark:text-brand-300">₹{{ lump().total | number:'1.0-0' }}</div></div>
            </div>
          </div>
        }

        @case ('fd') {
          <div class="card p-6 space-y-4">
            <div class="grid sm:grid-cols-4 gap-3">
              <div><label class="text-sm">Principal</label><input type="number" class="input mt-1" [(ngModel)]="fdAmt" /></div>
              <div><label class="text-sm">Rate %</label><input type="number" step="0.1" class="input mt-1" [(ngModel)]="fdRate" /></div>
              <div><label class="text-sm">Years</label><input type="number" class="input mt-1" [(ngModel)]="fdYears" /></div>
              <div><label class="text-sm">Compounding</label>
                <select class="input mt-1" [(ngModel)]="fdComp">
                  <option [ngValue]="4">Quarterly</option>
                  <option [ngValue]="12">Monthly</option>
                  <option [ngValue]="2">Half-yearly</option>
                  <option [ngValue]="1">Yearly</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="card p-4"><div class="text-xs text-slate-500">Principal</div><div class="text-xl font-bold mt-1">₹{{ fd().p | number:'1.0-0' }}</div></div>
              <div class="card p-4"><div class="text-xs text-slate-500">Interest earned</div><div class="text-xl font-bold mt-1 text-emerald-600">₹{{ fd().interest | number:'1.0-0' }}</div></div>
              <div class="card p-4 bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900"><div class="text-xs text-brand-700 dark:text-brand-300">Maturity</div><div class="text-xl font-bold mt-1 text-brand-700 dark:text-brand-300">₹{{ fd().maturity | number:'1.0-0' }}</div></div>
            </div>
          </div>
        }

        @case ('tax-us') {
          <div class="card p-6 space-y-4">
            <div class="grid sm:grid-cols-3 gap-3">
              <div><label class="text-sm">Gross income ($)</label><input type="number" class="input mt-1" [(ngModel)]="usGross" /></div>
              <div><label class="text-sm">Filing status</label>
                <select class="input mt-1" [(ngModel)]="usStatus">
                  <option value="single">Single</option>
                  <option value="married">Married jointly</option>
                  <option value="hoh">Head of household</option>
                </select>
              </div>
              <div><label class="text-sm">State (estimate)</label>
                <select class="input mt-1" [(ngModel)]="usState">
                  <option [ngValue]="0">No state tax</option>
                  <option [ngValue]="5">~5%</option>
                  <option [ngValue]="9">~9%</option>
                  <option [ngValue]="13">~13%</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="card p-4"><div class="text-xs text-slate-500">Federal tax</div><div class="text-xl font-bold mt-1 text-rose-600">\${{ taxUs().fed | number:'1.0-0' }}</div></div>
              <div class="card p-4"><div class="text-xs text-slate-500">State tax</div><div class="text-xl font-bold mt-1">\${{ taxUs().state | number:'1.0-0' }}</div></div>
              <div class="card p-4"><div class="text-xs text-slate-500">FICA (7.65%)</div><div class="text-xl font-bold mt-1">\${{ taxUs().fica | number:'1.0-0' }}</div></div>
              <div class="card p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"><div class="text-xs text-emerald-700 dark:text-emerald-300">Take-home</div><div class="text-xl font-bold mt-1 text-emerald-700 dark:text-emerald-300">\${{ taxUs().net | number:'1.0-0' }}</div></div>
            </div>
            <div class="text-xs text-slate-500">Estimates for 2025 brackets. Always consult a tax professional.</div>
          </div>
        }
      }
    </section>
  `,
})
export class CalcTax {
  protected tab = signal<Tab>('tax-in');
  protected tabs: { id: Tab; label: string }[] = [
    { id: 'tax-in', label: '🇮🇳 Income Tax' },
    { id: 'sip', label: 'SIP' },
    { id: 'lumpsum', label: 'Lumpsum' },
    { id: 'fd', label: 'Fixed Deposit' },
    { id: 'tax-us', label: '🇺🇸 US Tax' },
  ];

  // India tax
  protected inGross = 1500000; protected inStd = 75000; protected inRegime: 'old' | 'new' = 'new';
  protected inC80c = 150000; protected inC80d = 25000; protected inHomeLoan = 0;

  protected taxIn = computed(() => {
    let taxable = Math.max(0, (+this.inGross || 0) - (+this.inStd || 0));
    if (this.inRegime === 'old') {
      taxable = Math.max(0, taxable - Math.min(150000, +this.inC80c) - Math.min(25000, +this.inC80d) - Math.min(200000, +this.inHomeLoan));
    }
    const slabs = this.inRegime === 'new'
      ? [[400000, 0], [800000, 0.05], [1200000, 0.10], [1600000, 0.15], [2000000, 0.20], [2400000, 0.25], [Infinity, 0.30]] as const
      : [[250000, 0], [500000, 0.05], [1000000, 0.20], [Infinity, 0.30]] as const;
    let tax = 0, prev = 0;
    for (const [cap, rate] of slabs) {
      const slice = Math.max(0, Math.min(taxable, cap) - prev);
      tax += slice * rate;
      if (taxable <= cap) break;
      prev = cap;
    }
    // Section 87A rebate (new regime: up to 12 lakh, old: 5 lakh)
    const rebateCap = this.inRegime === 'new' ? 1200000 : 500000;
    if (taxable <= rebateCap) tax = 0;
    const cess = tax * 0.04;
    const total = tax + cess;
    const net = (+this.inGross || 0) - total;
    return { taxable, tax, cess, total, net, rate: (+this.inGross ? total / +this.inGross * 100 : 0), monthly: net / 12 };
  });

  // SIP
  protected sipMonthly = 10000; protected sipReturn = 12; protected sipYears = 15;
  protected sip = computed(() => {
    const n = (+this.sipYears || 0) * 12;
    const r = (+this.sipReturn || 0) / 100 / 12;
    const total = r === 0 ? +this.sipMonthly * n : +this.sipMonthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = +this.sipMonthly * n;
    return { invested, total, gains: total - invested };
  });

  // Lumpsum
  protected lsAmt = 100000; protected lsReturn = 12; protected lsYears = 10;
  protected lump = computed(() => {
    const total = +this.lsAmt * Math.pow(1 + +this.lsReturn / 100, +this.lsYears);
    return { invested: +this.lsAmt, total, gains: total - +this.lsAmt };
  });

  // FD
  protected fdAmt = 100000; protected fdRate = 7; protected fdYears = 5; protected fdComp = 4;
  protected fd = computed(() => {
    const p = +this.fdAmt; const r = +this.fdRate / 100 / +this.fdComp; const n = +this.fdComp * +this.fdYears;
    const maturity = p * Math.pow(1 + r, n);
    return { p, maturity, interest: maturity - p };
  });

  // US tax
  protected usGross = 80000; protected usStatus: 'single' | 'married' | 'hoh' = 'single'; protected usState = 5;
  protected taxUs = computed(() => {
    const std = this.usStatus === 'single' ? 14600 : this.usStatus === 'married' ? 29200 : 21900;
    const t = Math.max(0, (+this.usGross || 0) - std);
    const single = [[11600, 0.10], [47150, 0.12], [100525, 0.22], [191950, 0.24], [243725, 0.32], [609350, 0.35], [Infinity, 0.37]] as const;
    const married = [[23200, 0.10], [94300, 0.12], [201050, 0.22], [383900, 0.24], [487450, 0.32], [731200, 0.35], [Infinity, 0.37]] as const;
    const hoh = [[16550, 0.10], [63100, 0.12], [100500, 0.22], [191950, 0.24], [243700, 0.32], [609350, 0.35], [Infinity, 0.37]] as const;
    const slabs = this.usStatus === 'single' ? single : this.usStatus === 'married' ? married : hoh;
    let fed = 0, prev = 0;
    for (const [cap, rate] of slabs) {
      const slice = Math.max(0, Math.min(t, cap) - prev);
      fed += slice * rate;
      if (t <= cap) break; prev = cap;
    }
    const state = t * (+this.usState / 100);
    const fica = (+this.usGross) * 0.0765;
    const net = (+this.usGross) - fed - state - fica;
    return { fed, state, fica, net };
  });
}
