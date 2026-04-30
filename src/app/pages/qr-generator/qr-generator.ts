import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import { SectionHeader } from '../../shared/section-header/section-header';

type Mode = 'text' | 'url' | 'wifi' | 'email' | 'sms' | 'vcard' | 'upi';

@Component({
  selector: 'app-qr-generator',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="QR Code Generator" subtitle="Generate beautiful QR codes for URL, WiFi, UPI, vCard, email and more." icon="▦" color="from-slate-700 to-slate-900" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-[1fr_320px] gap-5">
      <div class="card p-6 space-y-4">
        <div>
          <label class="text-sm font-medium">Type</label>
          <div class="flex flex-wrap gap-1 mt-2">
            @for (m of modes; track m.id) {
              <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="mode() === m.id" (click)="mode.set(m.id); render()">{{ m.label }}</button>
            }
          </div>
        </div>

        @switch (mode()) {
          @case ('text') { <textarea class="input font-mono text-sm h-32" [(ngModel)]="text" (ngModelChange)="render()" placeholder="Any text…"></textarea> }
          @case ('url') { <input class="input" [(ngModel)]="text" (ngModelChange)="render()" placeholder="https://example.com" /> }
          @case ('wifi') {
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-medium">SSID</label><input class="input mt-1" [(ngModel)]="ssid" (ngModelChange)="render()" /></div>
              <div><label class="text-xs font-medium">Password</label><input class="input mt-1" [(ngModel)]="wifiPwd" (ngModelChange)="render()" /></div>
              <div><label class="text-xs font-medium">Encryption</label>
                <select class="input mt-1" [(ngModel)]="wifiEnc" (ngModelChange)="render()">
                  <option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">None</option>
                </select>
              </div>
              <label class="flex items-center gap-2 text-xs mt-5"><input type="checkbox" [(ngModel)]="wifiHidden" (ngModelChange)="render()" /> Hidden</label>
            </div>
          }
          @case ('email') {
            <div class="space-y-2">
              <input class="input" placeholder="to@example.com" [(ngModel)]="emailTo" (ngModelChange)="render()" />
              <input class="input" placeholder="Subject" [(ngModel)]="emailSub" (ngModelChange)="render()" />
              <textarea class="input h-24" placeholder="Body" [(ngModel)]="emailBody" (ngModelChange)="render()"></textarea>
            </div>
          }
          @case ('sms') {
            <div class="space-y-2">
              <input class="input" placeholder="+1234567890" [(ngModel)]="smsNo" (ngModelChange)="render()" />
              <textarea class="input h-24" placeholder="Message" [(ngModel)]="smsMsg" (ngModelChange)="render()"></textarea>
            </div>
          }
          @case ('vcard') {
            <div class="grid grid-cols-2 gap-2">
              <input class="input" placeholder="First name" [(ngModel)]="vc.fn" (ngModelChange)="render()" />
              <input class="input" placeholder="Last name" [(ngModel)]="vc.ln" (ngModelChange)="render()" />
              <input class="input col-span-2" placeholder="Phone" [(ngModel)]="vc.tel" (ngModelChange)="render()" />
              <input class="input col-span-2" placeholder="Email" [(ngModel)]="vc.email" (ngModelChange)="render()" />
              <input class="input col-span-2" placeholder="Organisation" [(ngModel)]="vc.org" (ngModelChange)="render()" />
              <input class="input col-span-2" placeholder="Website" [(ngModel)]="vc.url" (ngModelChange)="render()" />
            </div>
          }
          @case ('upi') {
            <div class="grid grid-cols-2 gap-2">
              <input class="input col-span-2" placeholder="UPI ID (e.g. name@bank)" [(ngModel)]="upi.pa" (ngModelChange)="render()" />
              <input class="input col-span-2" placeholder="Payee name" [(ngModel)]="upi.pn" (ngModelChange)="render()" />
              <input class="input" placeholder="Amount (optional)" type="number" [(ngModel)]="upi.am" (ngModelChange)="render()" />
              <input class="input" placeholder="Note (optional)" [(ngModel)]="upi.tn" (ngModelChange)="render()" />
            </div>
          }
        }

        <div class="grid grid-cols-3 gap-3">
          <div><label class="text-xs font-medium">Foreground</label><input type="color" class="mt-1 h-10 w-full rounded-lg" [(ngModel)]="fg" (ngModelChange)="render()" /></div>
          <div><label class="text-xs font-medium">Background</label><input type="color" class="mt-1 h-10 w-full rounded-lg" [(ngModel)]="bg" (ngModelChange)="render()" /></div>
          <div><label class="text-xs font-medium">Size</label><input type="number" min="200" max="1024" class="input mt-1" [(ngModel)]="size" (ngModelChange)="render()" /></div>
        </div>
      </div>

      <div class="card p-6 space-y-3 self-start sticky top-20">
        <div class="text-xs font-semibold text-slate-500 uppercase">QR Code</div>
        <canvas #out class="w-full rounded-xl border border-slate-200 dark:border-slate-700"></canvas>
        <div class="flex gap-2">
          <button class="btn-primary flex-1" (click)="download('png')">PNG</button>
          <button class="btn-secondary flex-1" (click)="download('svg')">SVG</button>
        </div>
      </div>
    </section>
  `,
})
export class QrGenerator {
  protected modes: { id: Mode; label: string }[] = [
    { id: 'text', label: 'Text' }, { id: 'url', label: 'URL' }, { id: 'wifi', label: 'WiFi' },
    { id: 'email', label: 'Email' }, { id: 'sms', label: 'SMS' }, { id: 'vcard', label: 'vCard' }, { id: 'upi', label: 'UPI' },
  ];
  protected mode = signal<Mode>('url');
  protected text = 'https://toolverse.app';
  protected ssid = 'MyNetwork'; protected wifiPwd = 'password'; protected wifiEnc = 'WPA'; protected wifiHidden = false;
  protected emailTo = ''; protected emailSub = ''; protected emailBody = '';
  protected smsNo = ''; protected smsMsg = '';
  protected vc = { fn: '', ln: '', tel: '', email: '', org: '', url: '' };
  protected upi = { pa: '', pn: '', am: '', tn: '' };
  protected fg = '#0f172a'; protected bg = '#ffffff'; protected size = 400;

  ngAfterViewInit() { this.render(); }
  constructor() { setTimeout(() => this.render(), 100); }

  build(): string {
    switch (this.mode()) {
      case 'text': case 'url': return this.text;
      case 'wifi': return `WIFI:T:${this.wifiEnc};S:${this.ssid};P:${this.wifiPwd};H:${this.wifiHidden ? 'true':'false'};;`;
      case 'email': return `mailto:${this.emailTo}?subject=${encodeURIComponent(this.emailSub)}&body=${encodeURIComponent(this.emailBody)}`;
      case 'sms': return `SMSTO:${this.smsNo}:${this.smsMsg}`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nN:${this.vc.ln};${this.vc.fn}\nFN:${this.vc.fn} ${this.vc.ln}\nTEL:${this.vc.tel}\nEMAIL:${this.vc.email}\nORG:${this.vc.org}\nURL:${this.vc.url}\nEND:VCARD`;
      case 'upi': {
        const params: string[] = [];
        if (this.upi.pa) params.push('pa=' + encodeURIComponent(this.upi.pa));
        if (this.upi.pn) params.push('pn=' + encodeURIComponent(this.upi.pn));
        if (this.upi.am) params.push('am=' + this.upi.am);
        if (this.upi.tn) params.push('tn=' + encodeURIComponent(this.upi.tn));
        params.push('cu=INR');
        return 'upi://pay?' + params.join('&');
      }
    }
  }

  async render() {
    const c = document.querySelector('canvas') as HTMLCanvasElement;
    if (!c) return;
    const data = this.build();
    if (!data) return;
    try {
      await QRCode.toCanvas(c, data, {
        width: +this.size,
        margin: 2,
        color: { dark: this.fg, light: this.bg },
        errorCorrectionLevel: 'M',
      });
    } catch {}
  }

  async download(fmt: 'png' | 'svg') {
    const data = this.build();
    if (fmt === 'svg') {
      const svg = await QRCode.toString(data, { type: 'svg', color: { dark: this.fg, light: this.bg }, width: +this.size });
      saveAs(new Blob([svg], { type: 'image/svg+xml' }), 'qr.svg');
    } else {
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/png'));
      saveAs(blob, 'qr.png');
    }
  }
}
