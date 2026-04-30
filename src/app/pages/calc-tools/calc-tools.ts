import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SectionHeader } from '../../shared/section-header/section-header';

type CalcTab = 'unit' | 'age' | 'date' | 'bmi' | 'loan' | 'tip' | 'pct' | 'gst' | 'roman' | 'numwords';

@Component({
  selector: 'app-calc-tools',
  imports: [FormsModule, CommonModule, SectionHeader],
  template: `
    <app-section-header title="Calculators & Converters" subtitle="Unit, age, date, BMI, loan, tip, percentage, GST, Roman, number-to-words." icon="∑" color="from-emerald-500 to-green-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-2 flex flex-wrap gap-1">
        @for (t of tabs; track t.id) {
          <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
        }
      </div>

      @switch (tab()) {
        @case ('unit') {
          <div class="card p-6 space-y-4">
            <div>
              <label class="text-sm font-medium">Category</label>
              <select class="input mt-1" [(ngModel)]="unitCat" (ngModelChange)="unitConvert()">
                @for (c of unitCats; track c.id) { <option [ngValue]="c.id">{{ c.label }}</option> }
              </select>
            </div>
            <div class="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div>
                <input type="number" class="input mb-2 text-2xl font-display font-bold" [(ngModel)]="unitVal" (ngModelChange)="unitConvert()" />
                <select class="input" [(ngModel)]="unitFrom" (ngModelChange)="unitConvert()">
                  @for (u of unitsFor(); track u.id) { <option [ngValue]="u.id">{{ u.name }}</option> }
                </select>
              </div>
              <div class="text-2xl text-slate-400 self-center mt-3">→</div>
              <div>
                <input class="input mb-2 text-2xl font-display font-bold !bg-slate-50 dark:!bg-slate-800/40" readonly [value]="unitOut() | number:'1.0-6'" />
                <select class="input" [(ngModel)]="unitTo" (ngModelChange)="unitConvert()">
                  @for (u of unitsFor(); track u.id) { <option [ngValue]="u.id">{{ u.name }}</option> }
                </select>
              </div>
            </div>
          </div>
        }
        @case ('age') {
          <div class="card p-6 space-y-4 max-w-md">
            <div>
              <label class="text-sm font-medium">Date of birth</label>
              <input type="date" class="input mt-1" [(ngModel)]="dob" (ngModelChange)="ageRun()" />
            </div>
            @if (ageOut()) {
              <div class="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6">
                <div class="text-sm opacity-80">You are</div>
                <div class="text-4xl font-display font-bold mt-1">{{ ageOut()!.years }} years, {{ ageOut()!.months }} months, {{ ageOut()!.days }} days</div>
                <div class="mt-3 text-sm opacity-80">{{ ageOut()!.totalDays }} days · {{ ageOut()!.totalWeeks }} weeks · {{ ageOut()!.totalMonths }} months</div>
              </div>
            }
          </div>
        }
        @case ('date') {
          <div class="card p-6 space-y-4 max-w-md">
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-sm font-medium">From</label><input type="date" class="input mt-1" [(ngModel)]="dateA" (ngModelChange)="dateRun()" /></div>
              <div><label class="text-sm font-medium">To</label><input type="date" class="input mt-1" [(ngModel)]="dateB" (ngModelChange)="dateRun()" /></div>
            </div>
            @if (dateOut()) { <div class="text-2xl font-display font-bold">{{ dateOut() }}</div> }
          </div>
        }
        @case ('bmi') {
          <div class="card p-6 space-y-4 max-w-md">
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-sm font-medium">Height (cm)</label><input type="number" class="input mt-1" [(ngModel)]="height" (ngModelChange)="bmiRun()" /></div>
              <div><label class="text-sm font-medium">Weight (kg)</label><input type="number" class="input mt-1" [(ngModel)]="weight" (ngModelChange)="bmiRun()" /></div>
            </div>
            @if (bmiOut()) {
              <div class="rounded-2xl p-6 text-white bg-gradient-to-br" [class.from-emerald-500]="bmiOut()!.cls==='Normal'" [class.to-teal-600]="bmiOut()!.cls==='Normal'" [class.from-amber-500]="bmiOut()!.cls!=='Normal'" [class.to-orange-600]="bmiOut()!.cls!=='Normal'">
                <div class="text-sm opacity-80">Your BMI</div>
                <div class="text-5xl font-display font-bold mt-1">{{ bmiOut()!.bmi }}</div>
                <div class="mt-2 font-semibold">{{ bmiOut()!.cls }}</div>
              </div>
            }
          </div>
        }
        @case ('loan') {
          <div class="card p-6 space-y-4 max-w-md">
            <div><label class="text-sm font-medium">Principal</label><input type="number" class="input mt-1" [(ngModel)]="principal" (ngModelChange)="loanRun()" /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-sm font-medium">Annual rate %</label><input type="number" step="0.01" class="input mt-1" [(ngModel)]="rate" (ngModelChange)="loanRun()" /></div>
              <div><label class="text-sm font-medium">Years</label><input type="number" class="input mt-1" [(ngModel)]="years" (ngModelChange)="loanRun()" /></div>
            </div>
            @if (loanOut()) {
              <div class="grid grid-cols-3 gap-3">
                <div class="card p-4"><div class="text-xs text-slate-500">EMI</div><div class="text-xl font-bold mt-1">{{ loanOut()!.emi | number:'1.2-2' }}</div></div>
                <div class="card p-4"><div class="text-xs text-slate-500">Interest</div><div class="text-xl font-bold mt-1">{{ loanOut()!.interest | number:'1.0-0' }}</div></div>
                <div class="card p-4"><div class="text-xs text-slate-500">Total payable</div><div class="text-xl font-bold mt-1">{{ loanOut()!.total | number:'1.0-0' }}</div></div>
              </div>
            }
          </div>
        }
        @case ('tip') {
          <div class="card p-6 space-y-4 max-w-md">
            <div><label class="text-sm font-medium">Bill</label><input type="number" class="input mt-1" [(ngModel)]="bill" (ngModelChange)="tipRun()" /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-sm font-medium">Tip %</label><input type="number" class="input mt-1" [(ngModel)]="tipPct" (ngModelChange)="tipRun()" /></div>
              <div><label class="text-sm font-medium">Split between</label><input type="number" min="1" class="input mt-1" [(ngModel)]="people" (ngModelChange)="tipRun()" /></div>
            </div>
            @if (tipOut()) {
              <div class="grid grid-cols-3 gap-3">
                <div class="card p-4"><div class="text-xs text-slate-500">Tip</div><div class="text-xl font-bold mt-1">{{ tipOut()!.tip | number:'1.2-2' }}</div></div>
                <div class="card p-4"><div class="text-xs text-slate-500">Total</div><div class="text-xl font-bold mt-1">{{ tipOut()!.total | number:'1.2-2' }}</div></div>
                <div class="card p-4"><div class="text-xs text-slate-500">Per person</div><div class="text-xl font-bold mt-1">{{ tipOut()!.each | number:'1.2-2' }}</div></div>
              </div>
            }
          </div>
        }
        @case ('pct') {
          <div class="card p-6 space-y-4 max-w-md">
            <div class="grid grid-cols-2 gap-3 items-end">
              <input type="number" class="input" [(ngModel)]="pctP" (ngModelChange)="pctRun()" placeholder="What percent" />
              <span class="self-center text-sm">% of</span>
            </div>
            <input type="number" class="input" [(ngModel)]="pctV" (ngModelChange)="pctRun()" placeholder="Value" />
            @if (pctOut() !== null) { <div class="text-3xl font-display font-bold">= {{ pctOut() | number:'1.0-4' }}</div> }
            <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
              <div class="text-xs font-semibold text-slate-500 mb-2">% change between two values</div>
              <div class="grid grid-cols-2 gap-3">
                <input type="number" class="input" [(ngModel)]="pctA" (ngModelChange)="pctRun()" placeholder="From" />
                <input type="number" class="input" [(ngModel)]="pctB" (ngModelChange)="pctRun()" placeholder="To" />
              </div>
              @if (pctChange() !== null) {
                <div class="mt-2 text-2xl font-display font-bold" [class.text-emerald-600]="pctChange()! >= 0" [class.text-rose-600]="pctChange()! < 0">
                  {{ pctChange()! >= 0 ? '+' : '' }}{{ pctChange() | number:'1.0-2' }}%
                </div>
              }
            </div>
          </div>
        }
        @case ('gst') {
          <div class="card p-6 space-y-4 max-w-md">
            <div class="flex gap-2">
              <button class="btn-secondary text-xs" [class.!bg-brand-50]="gstMode === 'add'" (click)="gstMode = 'add'; gstRun()">Add GST</button>
              <button class="btn-secondary text-xs" [class.!bg-brand-50]="gstMode === 'remove'" (click)="gstMode = 'remove'; gstRun()">Remove GST</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-sm font-medium">Amount</label><input type="number" class="input mt-1" [(ngModel)]="gstAmt" (ngModelChange)="gstRun()" /></div>
              <div>
                <label class="text-sm font-medium">GST %</label>
                <select class="input mt-1" [(ngModel)]="gstPct" (ngModelChange)="gstRun()">
                  <option [ngValue]="3">3%</option><option [ngValue]="5">5%</option><option [ngValue]="12">12%</option><option [ngValue]="18">18%</option><option [ngValue]="28">28%</option>
                </select>
              </div>
            </div>
            @if (gstOut()) {
              <div class="grid grid-cols-3 gap-3">
                <div class="card p-4"><div class="text-xs text-slate-500">Net</div><div class="text-xl font-bold mt-1">{{ gstOut()!.net | number:'1.2-2' }}</div></div>
                <div class="card p-4"><div class="text-xs text-slate-500">GST</div><div class="text-xl font-bold mt-1">{{ gstOut()!.gst | number:'1.2-2' }}</div></div>
                <div class="card p-4"><div class="text-xs text-slate-500">Gross</div><div class="text-xl font-bold mt-1">{{ gstOut()!.gross | number:'1.2-2' }}</div></div>
              </div>
            }
          </div>
        }
        @case ('roman') {
          <div class="card p-6 space-y-4 max-w-md">
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-sm font-medium">Number</label><input type="number" min="1" max="3999" class="input mt-1" [(ngModel)]="romNum" (ngModelChange)="romRun()" /></div>
              <div><label class="text-sm font-medium">Roman</label><input class="input mt-1 font-mono uppercase" [(ngModel)]="romStr" (ngModelChange)="romRun(true)" /></div>
            </div>
          </div>
        }
        @case ('numwords') {
          <div class="card p-6 space-y-4 max-w-md">
            <div><label class="text-sm font-medium">Number</label><input type="number" class="input mt-1" [(ngModel)]="nwNum" (ngModelChange)="nwRun()" /></div>
            @if (nwOut()) { <div class="text-lg font-display font-bold">{{ nwOut() }}</div> }
          </div>
        }
      }
    </section>
  `,
})
export class CalcTools {
  protected tab = signal<CalcTab>('unit');
  protected tabs: { id: CalcTab; label: string }[] = [
    { id: 'unit', label: 'Unit Converter' }, { id: 'age', label: 'Age' }, { id: 'date', label: 'Date Diff' },
    { id: 'bmi', label: 'BMI' }, { id: 'loan', label: 'Loan / EMI' }, { id: 'tip', label: 'Tip / Split' },
    { id: 'pct', label: 'Percentage' }, { id: 'gst', label: 'GST' }, { id: 'roman', label: 'Roman' },
    { id: 'numwords', label: 'Number to Words' },
  ];

  // Unit converter
  protected unitCats = [
    { id: 'length', label: 'Length' }, { id: 'mass', label: 'Mass' }, { id: 'temp', label: 'Temperature' },
    { id: 'area', label: 'Area' }, { id: 'volume', label: 'Volume' }, { id: 'speed', label: 'Speed' }, { id: 'data', label: 'Data' },
  ];
  private units: Record<string, { id: string; name: string; f: number }[]> = {
    length: [{ id: 'm', name: 'Meter (m)', f: 1 }, { id: 'km', name: 'Kilometer', f: 1000 }, { id: 'cm', name: 'Centimeter', f: 0.01 }, { id: 'mm', name: 'Millimeter', f: 0.001 }, { id: 'in', name: 'Inch', f: 0.0254 }, { id: 'ft', name: 'Foot', f: 0.3048 }, { id: 'yd', name: 'Yard', f: 0.9144 }, { id: 'mi', name: 'Mile', f: 1609.344 }],
    mass: [{ id: 'kg', name: 'Kilogram', f: 1 }, { id: 'g', name: 'Gram', f: 0.001 }, { id: 'mg', name: 'Milligram', f: 1e-6 }, { id: 'lb', name: 'Pound', f: 0.453592 }, { id: 'oz', name: 'Ounce', f: 0.0283495 }, { id: 't', name: 'Metric ton', f: 1000 }],
    area: [{ id: 'm2', name: 'Square meter', f: 1 }, { id: 'km2', name: 'Square km', f: 1e6 }, { id: 'ft2', name: 'Square foot', f: 0.092903 }, { id: 'ac', name: 'Acre', f: 4046.86 }, { id: 'ha', name: 'Hectare', f: 10000 }],
    volume: [{ id: 'l', name: 'Liter', f: 1 }, { id: 'ml', name: 'Milliliter', f: 0.001 }, { id: 'm3', name: 'Cubic meter', f: 1000 }, { id: 'gal', name: 'US gallon', f: 3.78541 }, { id: 'cup', name: 'US cup', f: 0.236588 }],
    speed: [{ id: 'kmh', name: 'km/h', f: 1 }, { id: 'mph', name: 'mph', f: 1.609344 }, { id: 'ms', name: 'm/s', f: 3.6 }, { id: 'kn', name: 'Knot', f: 1.852 }],
    data: [{ id: 'b', name: 'Byte', f: 1 }, { id: 'kb', name: 'Kilobyte', f: 1024 }, { id: 'mb', name: 'Megabyte', f: 1024 ** 2 }, { id: 'gb', name: 'Gigabyte', f: 1024 ** 3 }, { id: 'tb', name: 'Terabyte', f: 1024 ** 4 }],
    temp: [{ id: 'c', name: 'Celsius', f: 1 }, { id: 'f', name: 'Fahrenheit', f: 1 }, { id: 'k', name: 'Kelvin', f: 1 }],
  };
  protected unitCat = 'length'; protected unitFrom = 'm'; protected unitTo = 'ft'; protected unitVal = 1;
  protected unitOut = signal(0);
  unitsFor() { return this.units[this.unitCat]; }
  unitConvert() {
    if (this.unitCat === 'temp') {
      const v = +this.unitVal;
      let c = v;
      if (this.unitFrom === 'f') c = (v - 32) * 5 / 9;
      else if (this.unitFrom === 'k') c = v - 273.15;
      let r = c;
      if (this.unitTo === 'f') r = c * 9 / 5 + 32;
      else if (this.unitTo === 'k') r = c + 273.15;
      this.unitOut.set(r);
    } else {
      const a = this.units[this.unitCat].find(u => u.id === this.unitFrom)?.f ?? 1;
      const b = this.units[this.unitCat].find(u => u.id === this.unitTo)?.f ?? 1;
      this.unitOut.set(+this.unitVal * a / b);
    }
  }

  // Age
  protected dob = ''; protected ageOut = signal<{years:number;months:number;days:number;totalDays:number;totalWeeks:number;totalMonths:number} | null>(null);
  ageRun() {
    if (!this.dob) return;
    const a = new Date(this.dob); const b = new Date();
    let y = b.getFullYear() - a.getFullYear(); let m = b.getMonth() - a.getMonth(); let d = b.getDate() - a.getDate();
    if (d < 0) { m--; d += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    const totalDays = Math.floor((b.getTime() - a.getTime()) / 86400000);
    this.ageOut.set({ years: y, months: m, days: d, totalDays, totalWeeks: Math.floor(totalDays / 7), totalMonths: y * 12 + m });
  }

  // Date diff
  protected dateA = ''; protected dateB = ''; protected dateOut = signal('');
  dateRun() {
    if (!this.dateA || !this.dateB) return;
    const ms = Math.abs(new Date(this.dateB).getTime() - new Date(this.dateA).getTime());
    const d = Math.floor(ms / 86400000);
    this.dateOut.set(`${d.toLocaleString()} days · ${(d / 7).toFixed(1)} weeks · ${(d / 30.44).toFixed(1)} months · ${(d / 365.25).toFixed(2)} years`);
  }

  // BMI
  protected height = 170; protected weight = 70;
  protected bmiOut = signal<{bmi:string; cls:string} | null>(null);
  bmiRun() {
    if (!this.height || !this.weight) return;
    const b = +this.weight / Math.pow(+this.height / 100, 2);
    const cls = b < 18.5 ? 'Underweight' : b < 25 ? 'Normal' : b < 30 ? 'Overweight' : 'Obese';
    this.bmiOut.set({ bmi: b.toFixed(1), cls });
  }

  // Loan
  protected principal = 1000000; protected rate = 8.5; protected years = 5;
  protected loanOut = signal<{emi:number; interest:number; total:number} | null>(null);
  loanRun() {
    const r = +this.rate / 12 / 100; const n = +this.years * 12; const P = +this.principal;
    if (!P || !n) return;
    const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = emi * n;
    this.loanOut.set({ emi, total, interest: total - P });
  }

  // Tip
  protected bill = 1000; protected tipPct = 10; protected people = 2;
  protected tipOut = signal<{tip:number; total:number; each:number} | null>(null);
  tipRun() {
    const tip = +this.bill * +this.tipPct / 100; const total = +this.bill + tip;
    this.tipOut.set({ tip, total, each: total / Math.max(1, +this.people) });
  }

  // Percentage
  protected pctP = 25; protected pctV = 200; protected pctA = 100; protected pctB = 150;
  protected pctOut = signal<number | null>(null);
  protected pctChange = signal<number | null>(null);
  pctRun() {
    this.pctOut.set(+this.pctP * +this.pctV / 100);
    if (+this.pctA) this.pctChange.set(((+this.pctB - +this.pctA) / +this.pctA) * 100);
  }

  // GST
  protected gstMode: 'add' | 'remove' = 'add'; protected gstAmt = 1000; protected gstPct = 18;
  protected gstOut = signal<{net:number; gst:number; gross:number} | null>(null);
  gstRun() {
    const a = +this.gstAmt; const p = +this.gstPct / 100;
    if (this.gstMode === 'add') this.gstOut.set({ net: a, gst: a * p, gross: a * (1 + p) });
    else { const net = a / (1 + p); this.gstOut.set({ net, gst: a - net, gross: a }); }
  }

  // Roman
  protected romNum = 1234; protected romStr = '';
  romRun(fromStr = false) {
    if (fromStr) {
      const map: any = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
      let n = 0; const s = this.romStr.toUpperCase();
      for (let i = 0; i < s.length; i++) {
        const cur = map[s[i]]; const next = map[s[i + 1]];
        if (next > cur) { n += next - cur; i++; } else { n += cur; }
      }
      this.romNum = n;
    } else {
      const t: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
      let n = +this.romNum; let s = '';
      for (const [v, c] of t) while (n >= v) { s += c; n -= v; }
      this.romStr = s;
    }
  }

  // Number to words
  protected nwNum = 12345; protected nwOut = signal('');
  nwRun() { this.nwOut.set(this.toWords(+this.nwNum)); }
  private toWords(n: number): string {
    if (n === 0) return 'zero';
    const ones = ['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
    const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
    const inner = (x: number): string => {
      if (x < 20) return ones[x];
      if (x < 100) return tens[Math.floor(x/10)] + (x%10 ? '-' + ones[x%10] : '');
      if (x < 1000) return ones[Math.floor(x/100)] + ' hundred' + (x%100 ? ' ' + inner(x%100) : '');
      return '';
    };
    if (n < 0) return 'negative ' + this.toWords(-n);
    let out = '';
    const groups: [number, string][] = [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
    for (const [v, name] of groups) {
      if (n >= v) { out += inner(Math.floor(n / v)) + ' ' + name + ' '; n %= v; }
    }
    if (n > 0) out += inner(n);
    return out.trim();
  }

  constructor() {
    this.unitConvert(); this.bmiRun(); this.loanRun(); this.tipRun(); this.pctRun(); this.gstRun(); this.romRun(); this.nwRun();
  }
}
