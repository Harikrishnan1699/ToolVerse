import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { SectionHeader } from '../../shared/section-header/section-header';

interface Line { desc: string; qty: number; price: number; }

@Component({
  selector: 'app-invoice-generator',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Invoice Generator" subtitle="Build a professional PDF invoice — fully client-side. No accounts, no uploads." icon="🧾" color="from-emerald-500 to-teal-600" back="/" backLabel="Home" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-2 gap-5">

      <div class="card p-6 space-y-4">
        <div class="text-sm font-bold uppercase tracking-widest text-slate-500">From</div>
        <div class="grid grid-cols-2 gap-2">
          <input class="input" placeholder="Your company" [(ngModel)]="fromName" />
          <input class="input" placeholder="GSTIN / Tax ID" [(ngModel)]="fromTax" />
          <textarea class="input col-span-2" placeholder="Address" rows="2" [(ngModel)]="fromAddr"></textarea>
          <input class="input" placeholder="Email" [(ngModel)]="fromEmail" />
          <input class="input" placeholder="Phone" [(ngModel)]="fromPhone" />
        </div>

        <div class="text-sm font-bold uppercase tracking-widest text-slate-500 pt-2">Bill to</div>
        <div class="grid grid-cols-2 gap-2">
          <input class="input col-span-2" placeholder="Client name" [(ngModel)]="toName" />
          <textarea class="input col-span-2" placeholder="Client address" rows="2" [(ngModel)]="toAddr"></textarea>
          <input class="input" placeholder="Client email" [(ngModel)]="toEmail" />
          <input class="input" placeholder="GSTIN / Tax ID" [(ngModel)]="toTax" />
        </div>

        <div class="text-sm font-bold uppercase tracking-widest text-slate-500 pt-2">Invoice details</div>
        <div class="grid grid-cols-3 gap-2">
          <div><label class="text-xs">Invoice #</label><input class="input mt-1" [(ngModel)]="number" /></div>
          <div><label class="text-xs">Date</label><input type="date" class="input mt-1" [(ngModel)]="date" /></div>
          <div><label class="text-xs">Due</label><input type="date" class="input mt-1" [(ngModel)]="due" /></div>
          <div><label class="text-xs">Currency</label>
            <select class="input mt-1" [(ngModel)]="currency">
              <option value="₹">₹ INR</option>
              <option value="$">$ USD</option>
              <option value="€">€ EUR</option>
              <option value="£">£ GBP</option>
              <option value="¥">¥ JPY</option>
            </select>
          </div>
          <div><label class="text-xs">Tax %</label><input type="number" class="input mt-1" [(ngModel)]="taxPct" /></div>
          <div><label class="text-xs">Discount %</label><input type="number" class="input mt-1" [(ngModel)]="discountPct" /></div>
        </div>

        <div class="text-sm font-bold uppercase tracking-widest text-slate-500 pt-2">Line items</div>
        <div class="space-y-1.5">
          @for (l of lines; track $index; let i = $index) {
            <div class="grid grid-cols-[1fr_70px_90px_30px] gap-1.5 items-center">
              <input class="input text-sm" placeholder="Description" [(ngModel)]="l.desc" />
              <input type="number" class="input text-sm text-right" placeholder="Qty" [(ngModel)]="l.qty" />
              <input type="number" class="input text-sm text-right" placeholder="Price" [(ngModel)]="l.price" />
              <button class="btn-ghost text-rose-600" (click)="removeLine(i)">✕</button>
            </div>
          }
          <button class="btn-ghost text-xs" (click)="addLine()">+ Add line</button>
        </div>

        <div class="pt-3 border-t border-slate-200 dark:border-slate-700">
          <label class="text-xs font-medium">Notes / payment terms</label>
          <textarea class="input mt-1 text-sm" rows="2" [(ngModel)]="notes"></textarea>
        </div>

        <button class="btn-primary w-full" (click)="exportPdf()" [disabled]="busy()">
          @if (busy()) { Building PDF… } @else { ⬇ Download PDF }
        </button>
      </div>

      <div class="card p-6 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)] overflow-auto">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h1 class="text-3xl font-display font-bold text-slate-900 dark:text-white">INVOICE</h1>
            <div class="text-sm text-slate-500 mt-1">#{{ number }}</div>
          </div>
          <div class="text-right text-xs">
            <div class="text-slate-500">Date: <span class="text-slate-900 dark:text-white font-semibold">{{ date }}</span></div>
            <div class="text-slate-500 mt-0.5">Due: <span class="text-slate-900 dark:text-white font-semibold">{{ due }}</span></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">From</div>
            <div class="font-semibold">{{ fromName }}</div>
            <div class="text-xs text-slate-500 whitespace-pre-line">{{ fromAddr }}</div>
            <div class="text-xs text-slate-500">{{ fromEmail }}</div>
            <div class="text-xs text-slate-500">{{ fromPhone }}</div>
            @if (fromTax) { <div class="text-xs text-slate-500">Tax: {{ fromTax }}</div> }
          </div>
          <div>
            <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Bill to</div>
            <div class="font-semibold">{{ toName }}</div>
            <div class="text-xs text-slate-500 whitespace-pre-line">{{ toAddr }}</div>
            <div class="text-xs text-slate-500">{{ toEmail }}</div>
            @if (toTax) { <div class="text-xs text-slate-500">Tax: {{ toTax }}</div> }
          </div>
        </div>

        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <th class="py-2">Description</th>
              <th class="text-right py-2 w-16">Qty</th>
              <th class="text-right py-2 w-24">Price</th>
              <th class="text-right py-2 w-24">Total</th>
            </tr>
          </thead>
          <tbody>
            @for (l of lines; track $index) {
              <tr class="border-b border-slate-100 dark:border-slate-800">
                <td class="py-2">{{ l.desc || '—' }}</td>
                <td class="text-right py-2">{{ +l.qty || 0 }}</td>
                <td class="text-right py-2">{{ currency }}{{ (+l.price || 0).toFixed(2) }}</td>
                <td class="text-right py-2 font-semibold">{{ currency }}{{ lineTotal(l).toFixed(2) }}</td>
              </tr>
            }
          </tbody>
        </table>

        <div class="mt-4 ml-auto w-56 text-sm space-y-1">
          <div class="flex justify-between text-slate-500"><span>Subtotal</span><span>{{ currency }}{{ subtotal().toFixed(2) }}</span></div>
          @if (+discountPct > 0) { <div class="flex justify-between text-rose-600"><span>Discount ({{ discountPct }}%)</span><span>−{{ currency }}{{ discountAmt().toFixed(2) }}</span></div> }
          @if (+taxPct > 0) { <div class="flex justify-between text-slate-500"><span>Tax ({{ taxPct }}%)</span><span>{{ currency }}{{ taxAmt().toFixed(2) }}</span></div> }
          <div class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white"><span>Total</span><span>{{ currency }}{{ total().toFixed(2) }}</span></div>
        </div>

        @if (notes) {
          <div class="mt-6 text-xs text-slate-500">
            <div class="font-bold uppercase tracking-widest text-[10px] mb-1">Notes</div>
            <div class="whitespace-pre-line">{{ notes }}</div>
          </div>
        }
      </div>
    </section>
  `,
})
export class InvoiceGenerator {
  protected fromName = 'Toolverse Studio'; protected fromTax = ''; protected fromAddr = '';
  protected fromEmail = ''; protected fromPhone = '';
  protected toName = ''; protected toTax = ''; protected toAddr = ''; protected toEmail = '';
  protected number = 'INV-' + new Date().getFullYear() + '-001';
  protected date = new Date().toISOString().slice(0, 10);
  protected due = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);
  protected currency = '₹';
  protected taxPct = 18;
  protected discountPct = 0;
  protected notes = 'Payment due within 14 days. Thank you for your business.';
  protected lines: Line[] = [
    { desc: 'Design service', qty: 1, price: 12000 },
    { desc: 'Development hours', qty: 10, price: 1500 },
  ];
  protected busy = signal(false);

  lineTotal(l: Line) { return (+l.qty || 0) * (+l.price || 0); }
  subtotal = computed(() => this.lines.reduce((s, l) => s + this.lineTotal(l), 0));
  discountAmt = computed(() => this.subtotal() * (+this.discountPct || 0) / 100);
  taxAmt = computed(() => (this.subtotal() - this.discountAmt()) * (+this.taxPct || 0) / 100);
  total = computed(() => this.subtotal() - this.discountAmt() + this.taxAmt());

  addLine() { this.lines.push({ desc: '', qty: 1, price: 0 }); }
  removeLine(i: number) { this.lines.splice(i, 1); }

  // pdf-lib's standard Helvetica uses WinAnsi encoding which can't render ₹
  // (or other characters outside Latin-1). Map known symbols to safe ASCII
  // and replace remaining out-of-range chars with '?' so drawText never throws.
  private pdfCurrency(): string {
    return this.currency === '₹' ? 'Rs.' : this.currency;
  }
  private safe(s: string): string {
    if (s == null) return '';
    return String(s)
      .replace(/₹/g, 'Rs.')
      .replace(/[^\x00-\xFF€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/g, '?');
  }

  async exportPdf() {
    this.busy.set(true);
    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([595.28, 841.89]); // A4
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const { width } = page.getSize();
      const margin = 50;
      const black = rgb(0.06, 0.09, 0.16);
      const gray = rgb(0.45, 0.49, 0.55);
      const cur = this.pdfCurrency();
      const safe = (s: string) => this.safe(s);

      let y = 770;
      page.drawText('INVOICE', { x: margin, y, size: 28, font: bold, color: black }); y -= 22;
      page.drawText('#' + safe(this.number), { x: margin, y, size: 11, font, color: gray });

      page.drawText('Date: ' + safe(this.date), { x: 380, y: 770, size: 10, font, color: gray });
      page.drawText('Due: ' + safe(this.due), { x: 380, y: 754, size: 10, font, color: gray });

      y = 700;
      page.drawText('FROM', { x: margin, y, size: 9, font: bold, color: gray }); y -= 14;
      page.drawText(safe(this.fromName), { x: margin, y, size: 12, font: bold, color: black }); y -= 14;
      for (const ln of this.fromAddr.split('\n')) { page.drawText(safe(ln), { x: margin, y, size: 10, font, color: gray }); y -= 12; }
      if (this.fromEmail) { page.drawText(safe(this.fromEmail), { x: margin, y, size: 10, font, color: gray }); y -= 12; }
      if (this.fromPhone) { page.drawText(safe(this.fromPhone), { x: margin, y, size: 10, font, color: gray }); y -= 12; }
      if (this.fromTax) { page.drawText('Tax: ' + safe(this.fromTax), { x: margin, y, size: 10, font, color: gray }); y -= 12; }

      let yR = 700;
      page.drawText('BILL TO', { x: 320, y: yR, size: 9, font: bold, color: gray }); yR -= 14;
      page.drawText(safe(this.toName), { x: 320, y: yR, size: 12, font: bold, color: black }); yR -= 14;
      for (const ln of this.toAddr.split('\n')) { page.drawText(safe(ln), { x: 320, y: yR, size: 10, font, color: gray }); yR -= 12; }
      if (this.toEmail) { page.drawText(safe(this.toEmail), { x: 320, y: yR, size: 10, font, color: gray }); yR -= 12; }
      if (this.toTax) { page.drawText('Tax: ' + safe(this.toTax), { x: 320, y: yR, size: 10, font, color: gray }); yR -= 12; }

      y = 540;
      page.drawRectangle({ x: margin, y: y - 4, width: width - margin * 2, height: 22, color: rgb(0.96, 0.97, 0.98) });
      page.drawText('DESCRIPTION', { x: margin + 6, y: y + 2, size: 9, font: bold, color: gray });
      page.drawText('QTY', { x: 360, y: y + 2, size: 9, font: bold, color: gray });
      page.drawText('PRICE', { x: 420, y: y + 2, size: 9, font: bold, color: gray });
      page.drawText('TOTAL', { x: 500, y: y + 2, size: 9, font: bold, color: gray });
      y -= 24;

      for (const l of this.lines) {
        page.drawText(safe((l.desc || '').slice(0, 50)), { x: margin + 6, y, size: 10, font, color: black });
        page.drawText(String(+l.qty || 0), { x: 360, y, size: 10, font, color: black });
        page.drawText(cur + (+l.price || 0).toFixed(2), { x: 420, y, size: 10, font, color: black });
        page.drawText(cur + this.lineTotal(l).toFixed(2), { x: 500, y, size: 10, font: bold, color: black });
        y -= 18;
      }

      y -= 10;
      const totalsX = 400;
      page.drawText('Subtotal', { x: totalsX, y, size: 10, font, color: gray });
      page.drawText(cur + this.subtotal().toFixed(2), { x: 500, y, size: 10, font, color: black }); y -= 14;
      if (+this.discountPct > 0) {
        page.drawText(`Discount (${this.discountPct}%)`, { x: totalsX, y, size: 10, font, color: gray });
        page.drawText('-' + cur + this.discountAmt().toFixed(2), { x: 500, y, size: 10, font, color: rgb(0.85, 0.2, 0.3) }); y -= 14;
      }
      if (+this.taxPct > 0) {
        page.drawText(`Tax (${this.taxPct}%)`, { x: totalsX, y, size: 10, font, color: gray });
        page.drawText(cur + this.taxAmt().toFixed(2), { x: 500, y, size: 10, font, color: black }); y -= 14;
      }
      y -= 4;
      page.drawLine({ start: { x: totalsX, y: y + 4 }, end: { x: 555, y: y + 4 }, color: gray, thickness: 0.5 });
      page.drawText('TOTAL', { x: totalsX, y: y - 10, size: 12, font: bold, color: black });
      page.drawText(cur + this.total().toFixed(2), { x: 500, y: y - 10, size: 12, font: bold, color: black });

      if (this.notes) {
        let yn = 130;
        page.drawText('NOTES', { x: margin, y: yn, size: 9, font: bold, color: gray }); yn -= 14;
        for (const ln of this.notes.split('\n')) { page.drawText(safe(ln.slice(0, 90)), { x: margin, y: yn, size: 9, font, color: gray }); yn -= 12; }
      }

      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), `${this.number}.pdf`);
    } finally {
      this.busy.set(false);
    }
  }
}
