import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';
import { SectionHeader } from '../../shared/section-header/section-header';
import { WebShareService } from '../../shared/web-share.service';

type Mode = 'text' | 'url' | 'wifi' | 'email' | 'sms' | 'vcard' | 'upi' | 'image';
type LogoShape = 'square' | 'rounded' | 'circle';

@Component({
  selector: 'app-qr-generator',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="QR Code Generator" subtitle="Generate beautiful QR codes — add your logo in the center." icon="▦" color="from-slate-700 to-slate-900" />
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
          @case ('image') {
            <div class="space-y-3">
              @if (!imgDataUrl()) {
                <label class="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center hover:border-brand-400 transition">
                  <input type="file" class="sr-only" accept="image/*" (change)="onImagePick($event)" />
                  <div class="text-4xl">🖼</div>
                  <div class="mt-2 text-sm font-semibold">Upload an image</div>
                  <div class="text-xs text-slate-500 mt-1">JPG, PNG, WebP — auto-compressed to fit a QR code</div>
                </label>
              } @else {
                <div class="grid grid-cols-2 gap-3 items-start">
                  <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2 grid place-items-center">
                    <img [src]="imgDataUrl()!" alt="Preview" class="max-h-48 object-contain" />
                    <div class="text-[10px] text-slate-500 mt-1">Scanned result</div>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label class="text-xs font-medium flex items-center justify-between">
                        <span>Max dimension: {{ imgMaxDim() }}px</span>
                      </label>
                      <input type="range" min="32" max="160" step="4" class="w-full mt-1 accent-brand-500"
                             [ngModel]="imgMaxDim()" (ngModelChange)="imgMaxDim.set(+$event); reprocessImage()" />
                    </div>
                    <div>
                      <label class="text-xs font-medium flex items-center justify-between">
                        <span>Quality: {{ imgQuality().toFixed(2) }}</span>
                      </label>
                      <input type="range" min="0.2" max="0.9" step="0.05" class="w-full mt-1 accent-brand-500"
                             [ngModel]="imgQuality()" (ngModelChange)="imgQuality.set(+$event); reprocessImage()" />
                    </div>
                    <div>
                      <label class="text-xs font-medium">Format</label>
                      <select class="input mt-1" [ngModel]="imgFormat()" (ngModelChange)="imgFormat.set($event); reprocessImage()">
                        <option value="image/jpeg">JPEG (smaller)</option>
                        <option value="image/webp">WebP (smallest)</option>
                        <option value="image/png">PNG (lossless)</option>
                      </select>
                    </div>
                    <button class="btn-ghost text-xs px-2 py-1 text-rose-600 w-full" (click)="removeImage()">Remove image</button>
                  </div>
                </div>

                <div class="rounded-xl p-3 text-xs"
                     [class.bg-emerald-50]="imgFits()" [class.text-emerald-700]="imgFits()" [class.dark:bg-emerald-950]="imgFits()" [class.dark:text-emerald-300]="imgFits()"
                     [class.bg-amber-50]="!imgFits()" [class.text-amber-700]="!imgFits()" [class.dark:bg-amber-950]="!imgFits()" [class.dark:text-amber-300]="!imgFits()">
                  @if (imgFits()) {
                    ✓ Encoded as data URL · {{ imgPayloadBytes() }} bytes · fits in a QR
                  } @else {
                    ⚠ Payload {{ imgPayloadBytes() }} bytes — too large for a single QR. Lower size or quality, or pick a smaller image.
                  }
                </div>
                <div class="text-[11px] text-slate-500 leading-snug">
                  The QR encodes a <code>data:image</code> URL. When scanned, most phone scanners open it in the browser and the image appears. Image is embedded directly — no upload, fully offline.
                </div>
              }
            </div>
          }
        }

        <div class="grid grid-cols-3 gap-3">
          <div><label class="text-xs font-medium">Foreground</label><input type="color" class="mt-1 h-10 w-full rounded-lg" [(ngModel)]="fg" (ngModelChange)="render()" /></div>
          <div><label class="text-xs font-medium">Background</label><input type="color" class="mt-1 h-10 w-full rounded-lg" [(ngModel)]="bg" (ngModelChange)="render()" /></div>
          <div><label class="text-xs font-medium">Size</label><input type="number" min="200" max="1024" class="input mt-1" [(ngModel)]="size" (ngModelChange)="render()" /></div>
        </div>

        <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium">Logo / image (centered)</label>
            @if (logoUrl()) {
              <button class="btn-ghost text-xs px-2 py-1 text-rose-600" (click)="removeLogo()">Remove</button>
            }
          </div>

          @if (!logoUrl()) {
            <label class="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-5 text-center hover:border-brand-400 transition">
              <input type="file" class="sr-only" accept="image/*" (change)="onLogoPick($event)" />
              <div class="text-3xl">🖼</div>
              <div class="mt-2 text-sm font-medium">Choose an image</div>
              <div class="text-xs text-slate-500">JPG, PNG, SVG · Higher error-correction enables larger logos</div>
            </label>
          } @else {
            <div class="flex items-center gap-3 mb-3">
              <img [src]="logoUrl()!" alt="Logo" class="w-16 h-16 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white" />
              <div class="text-xs text-slate-500 truncate flex-1">{{ logoName() }}</div>
              <label class="btn-ghost text-xs px-2 py-1 cursor-pointer">
                Change
                <input type="file" class="hidden" accept="image/*" (change)="onLogoPick($event)" />
              </label>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-medium">Size: {{ logoScale() }}%</label>
                <input type="range" min="10" max="35" step="1" class="w-full mt-1 accent-brand-500"
                       [ngModel]="logoScale()" (ngModelChange)="logoScale.set(+$event); render()" />
              </div>
              <div>
                <label class="text-xs font-medium">Padding: {{ logoPad() }}px</label>
                <input type="range" min="0" max="24" step="1" class="w-full mt-1 accent-brand-500"
                       [ngModel]="logoPad()" (ngModelChange)="logoPad.set(+$event); render()" />
              </div>
              <div>
                <label class="text-xs font-medium">Shape</label>
                <select class="input mt-1" [ngModel]="logoShape()" (ngModelChange)="logoShape.set($event); render()">
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="circle">Circle</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-medium">Backdrop</label>
                <select class="input mt-1" [ngModel]="logoBg()" (ngModelChange)="logoBg.set($event); render()">
                  <option value="match">Match QR bg</option>
                  <option value="white">White</option>
                  <option value="none">None (transparent)</option>
                </select>
              </div>
            </div>

            <div class="mt-3 text-[11px] text-slate-500 leading-snug">
              Logos cover QR modules. Toolverse auto-uses high error-correction (≈30% recoverable) when a logo is set — keep the logo under ~25% of the QR for reliable scanning.
            </div>
          }
        </div>
      </div>

      <div class="card p-6 space-y-3 self-start sticky top-20">
        <div class="text-xs font-semibold text-slate-500 uppercase">QR Code</div>
        <canvas #out class="w-full rounded-xl border border-slate-200 dark:border-slate-700"></canvas>
        <div class="flex flex-wrap gap-2">
          <button class="btn-primary flex-1" (click)="download('png')">PNG</button>
          <button class="btn-secondary flex-1" (click)="download('svg')">SVG</button>
          @if (share.supported) {
            <button class="btn-secondary w-full" (click)="shareImage()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12"/></svg>
              Share
            </button>
          }
        </div>
        @if (logoUrl()) {
          <div class="text-[11px] text-emerald-600">✓ Logo embedded · EC level H</div>
        }
      </div>
    </section>
  `,
})
export class QrGenerator implements OnInit {
  @ViewChild('out') outRef?: ElementRef<HTMLCanvasElement>;
  protected share = inject(WebShareService);
  private route = inject(ActivatedRoute);

  protected modes: { id: Mode; label: string }[] = [
    { id: 'text', label: 'Text' }, { id: 'url', label: 'URL' }, { id: 'wifi', label: 'WiFi' },
    { id: 'email', label: 'Email' }, { id: 'sms', label: 'SMS' }, { id: 'vcard', label: 'vCard' }, { id: 'upi', label: 'UPI' },
    { id: 'image', label: 'Image' },
  ];
  protected mode = signal<Mode>('url');
  protected text = 'https://toolverse.app';
  protected ssid = 'MyNetwork'; protected wifiPwd = 'password'; protected wifiEnc = 'WPA'; protected wifiHidden = false;
  protected emailTo = ''; protected emailSub = ''; protected emailBody = '';
  protected smsNo = ''; protected smsMsg = '';
  protected vc = { fn: '', ln: '', tel: '', email: '', org: '', url: '' };
  protected upi = { pa: '', pn: '', am: '', tn: '' };
  protected fg = '#0f172a'; protected bg = '#ffffff'; protected size = 400;

  protected logoUrl = signal<string | null>(null);
  protected logoName = signal('');
  protected logoScale = signal(20);
  protected logoPad = signal(8);
  protected logoShape = signal<LogoShape>('rounded');
  protected logoBg = signal<'match' | 'white' | 'none'>('match');
  private logoImage: HTMLImageElement | null = null;

  // Image-to-QR encoding (mode === 'image')
  protected imgDataUrl = signal<string | null>(null);
  protected imgMaxDim = signal(80);
  protected imgQuality = signal(0.6);
  protected imgFormat = signal<'image/jpeg' | 'image/webp' | 'image/png'>('image/webp');
  protected imgPayloadBytes = signal(0);
  protected imgFits = signal(true);
  private imgSource: HTMLImageElement | null = null;
  private readonly QR_MAX_PAYLOAD = 2900;

  ngAfterViewInit() { this.render(); }
  constructor() { setTimeout(() => this.render(), 100); }

  ngOnInit() {
    const incoming = (window as any).__tvIncomingText as string | undefined;
    const qsText = this.route.snapshot.queryParamMap.get('text') ?? this.route.snapshot.queryParamMap.get('data');
    const seed = incoming ?? qsText;
    if (seed) {
      delete (window as any).__tvIncomingText;
      this.text = seed;
      this.mode.set(/^https?:\/\//.test(seed) ? 'url' : 'text');
      setTimeout(() => this.render(), 0);
    }
  }

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
      case 'image': return this.imgDataUrl() ?? '';
    }
  }

  onImagePick(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => { this.imgSource = img; this.reprocessImage(); };
      img.onerror = () => { this.imgSource = null; };
      img.src = dataUrl;
    };
    reader.readAsDataURL(f);
    input.value = '';
  }

  reprocessImage() {
    if (!this.imgSource) return;
    const src = this.imgSource;
    const max = this.imgMaxDim();
    const ratio = src.naturalWidth / src.naturalHeight;
    let w = src.naturalWidth, h = src.naturalHeight;
    if (Math.max(w, h) > max) {
      if (ratio >= 1) { w = max; h = Math.round(max / ratio); }
      else { h = max; w = Math.round(max * ratio); }
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(src, 0, 0, w, h);
    const fmt = this.imgFormat();
    const quality = fmt === 'image/png' ? undefined : this.imgQuality();
    const dataUrl = c.toDataURL(fmt, quality);
    this.imgDataUrl.set(dataUrl);
    this.imgPayloadBytes.set(dataUrl.length);
    this.imgFits.set(dataUrl.length <= this.QR_MAX_PAYLOAD);
    this.render();
  }

  removeImage() {
    this.imgSource = null;
    this.imgDataUrl.set(null);
    this.imgPayloadBytes.set(0);
    this.imgFits.set(true);
    this.render();
  }

  async onLogoPick(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.logoUrl.set(dataUrl);
      this.logoName.set(f.name);
      const img = new Image();
      img.onload = () => { this.logoImage = img; this.render(); };
      img.onerror = () => { this.logoImage = null; };
      img.src = dataUrl;
    };
    reader.readAsDataURL(f);
    input.value = '';
  }

  removeLogo() {
    this.logoUrl.set(null);
    this.logoName.set('');
    this.logoImage = null;
    this.render();
  }

  async render() {
    const c = this.outRef?.nativeElement ?? document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!c) return;
    const data = this.build();
    if (!data) return;
    if (this.mode() === 'image' && !this.imgFits()) return;
    const ec = this.mode() === 'image' ? 'L' : (this.logoImage ? 'H' : 'M');
    try {
      await QRCode.toCanvas(c, data, {
        width: +this.size,
        margin: 2,
        color: { dark: this.fg, light: this.bg },
        errorCorrectionLevel: ec,
      });
      if (this.logoImage && this.mode() !== 'image') this.drawLogoOnCanvas(c);
    } catch {}
  }

  private drawLogoOnCanvas(c: HTMLCanvasElement) {
    const img = this.logoImage;
    if (!img) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;

    const w = c.width;
    const logoScale = this.logoScale() / 100;
    const logoBox = Math.round(w * logoScale);
    const pad = this.logoPad();
    const total = logoBox + pad * 2;
    const x = Math.round((w - total) / 2);
    const y = Math.round((w - total) / 2);
    const shape = this.logoShape();
    const bgChoice = this.logoBg();

    if (bgChoice !== 'none') {
      const bgColor = bgChoice === 'white' ? '#ffffff' : this.bg;
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      if (shape === 'circle') {
        ctx.arc(x + total / 2, y + total / 2, total / 2, 0, Math.PI * 2);
      } else if (shape === 'rounded') {
        const r = Math.min(total / 5, 16);
        roundRectPath(ctx, x, y, total, total, r);
      } else {
        ctx.rect(x, y, total, total);
      }
      ctx.fill();
    }

    ctx.save();
    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(x + total / 2, y + total / 2, logoBox / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (shape === 'rounded') {
      const r = Math.min(logoBox / 5, 14);
      ctx.beginPath();
      roundRectPath(ctx, x + pad, y + pad, logoBox, logoBox, r);
      ctx.clip();
    }

    const ir = img.naturalWidth / img.naturalHeight;
    let dw = logoBox, dh = logoBox;
    if (ir > 1) { dh = logoBox / ir; } else if (ir < 1) { dw = logoBox * ir; }
    const dx = x + pad + (logoBox - dw) / 2;
    const dy = y + pad + (logoBox - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  async shareImage() {
    const c = this.outRef?.nativeElement; if (!c) return;
    const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/png'));
    await this.share.shareFile(new File([blob], 'qr.png', { type: 'image/png' }));
  }

  async download(fmt: 'png' | 'svg') {
    const data = this.build();
    if (fmt === 'svg') {
      const svg = await QRCode.toString(data, {
        type: 'svg',
        color: { dark: this.fg, light: this.bg },
        width: +this.size,
        errorCorrectionLevel: this.logoImage ? 'H' : 'M',
      });
      const withLogo = this.logoImage ? this.embedLogoInSvg(svg) : svg;
      saveAs(new Blob([withLogo], { type: 'image/svg+xml' }), 'qr.svg');
    } else {
      const c = this.outRef?.nativeElement;
      if (!c) return;
      const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/png'));
      saveAs(blob, 'qr.png');
    }
  }

  private embedLogoInSvg(svg: string): string {
    if (!this.logoUrl()) return svg;
    const sizeMatch = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
    const w = sizeMatch ? parseFloat(sizeMatch[1]) : +this.size;
    const logoBox = w * this.logoScale() / 100;
    const padPx = this.logoPad() / +this.size * w;
    const total = logoBox + padPx * 2;
    const cx = (w - total) / 2;
    const cy = (w - total) / 2;
    const shape = this.logoShape();
    const bgChoice = this.logoBg();
    let bgEl = '';
    if (bgChoice !== 'none') {
      const bg = bgChoice === 'white' ? '#ffffff' : this.bg;
      if (shape === 'circle') {
        bgEl = `<circle cx="${cx + total/2}" cy="${cy + total/2}" r="${total/2}" fill="${bg}"/>`;
      } else {
        const r = shape === 'rounded' ? Math.min(total/5, 16) : 0;
        bgEl = `<rect x="${cx}" y="${cy}" width="${total}" height="${total}" rx="${r}" fill="${bg}"/>`;
      }
    }
    let clipId = 'logoClip';
    let clipDef = '';
    let imageAttrs = '';
    if (shape === 'circle') {
      clipDef = `<defs><clipPath id="${clipId}"><circle cx="${cx + total/2}" cy="${cy + total/2}" r="${logoBox/2}"/></clipPath></defs>`;
      imageAttrs = `clip-path="url(#${clipId})"`;
    } else if (shape === 'rounded') {
      const r = Math.min(logoBox/5, 14);
      clipDef = `<defs><clipPath id="${clipId}"><rect x="${cx + padPx}" y="${cy + padPx}" width="${logoBox}" height="${logoBox}" rx="${r}"/></clipPath></defs>`;
      imageAttrs = `clip-path="url(#${clipId})"`;
    }
    const imageEl = `<image href="${this.logoUrl()}" x="${cx + padPx}" y="${cy + padPx}" width="${logoBox}" height="${logoBox}" preserveAspectRatio="xMidYMid meet" ${imageAttrs}/>`;
    return svg.replace('</svg>', `${clipDef}${bgEl}${imageEl}</svg>`);
  }
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}
