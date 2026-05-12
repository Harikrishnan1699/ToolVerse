import { Component, OnDestroy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-sec-totp',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="TOTP / 2FA Generator" subtitle="Paste your Base32 secret — get the current 6-digit code, rotating every 30s." icon="🔑" color="from-violet-500 to-purple-600" back="/" backLabel="Home" />
    <section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">

      <div class="card p-5 space-y-3">
        <div>
          <label class="text-sm font-medium">Secret (Base32)</label>
          <input class="input font-mono mt-1" placeholder="JBSWY3DPEHPK3PXP" [(ngModel)]="secret" (ngModelChange)="run()" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="text-xs">Digits</label>
            <select class="input mt-1" [(ngModel)]="digits" (ngModelChange)="run()">
              <option [ngValue]="6">6</option><option [ngValue]="8">8</option>
            </select>
          </div>
          <div><label class="text-xs">Period (s)</label>
            <input type="number" class="input mt-1" [(ngModel)]="period" (ngModelChange)="run()" />
          </div>
          <div><label class="text-xs">Algorithm</label>
            <select class="input mt-1" [(ngModel)]="algo" (ngModelChange)="run()">
              <option value="SHA-1">SHA-1</option>
              <option value="SHA-256">SHA-256</option>
              <option value="SHA-512">SHA-512</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card p-6 bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white text-center">
        <div class="text-xs uppercase tracking-widest opacity-80">Current code</div>
        <div class="text-6xl font-display font-bold tabular-nums mt-2 tracking-wider">
          @if (error()) { <span class="text-2xl">⚠</span> } @else { {{ code() }} }
        </div>
        <div class="mt-4 mx-auto max-w-xs">
          <div class="h-2 rounded-full bg-white/20 overflow-hidden">
            <div class="h-full bg-white transition-all duration-1000" [style.width.%]="100 - progress()"></div>
          </div>
          <div class="mt-1 text-xs opacity-80">{{ remaining() }}s until next code</div>
        </div>
        <button class="btn mt-4 bg-white text-slate-900 hover:bg-slate-100 text-sm" (click)="copy()" [disabled]="!!error()">Copy code</button>
      </div>

      @if (nextCode()) {
        <div class="card p-4 text-sm flex justify-between items-center">
          <span class="text-slate-500">Next code</span>
          <span class="font-mono font-bold tabular-nums tracking-wider">{{ nextCode() }}</span>
        </div>
      }

      @if (error()) {
        <div class="card p-3 text-sm text-rose-600 border-rose-200">⚠ {{ error() }}</div>
      }

      <div class="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 p-3 text-xs text-sky-900 dark:text-sky-200">
        🔒 The secret is processed only in your browser. Nothing is sent, stored, or logged. Refreshing this page clears it.
      </div>
    </section>
  `,
})
export class SecTotp implements OnDestroy {
  protected secret = 'JBSWY3DPEHPK3PXP';
  protected digits = 6;
  protected period = 30;
  protected algo: 'SHA-1' | 'SHA-256' | 'SHA-512' = 'SHA-1';
  protected code = signal('------');
  protected nextCode = signal('');
  protected progress = signal(0);
  protected remaining = signal(30);
  protected error = signal('');

  private interval: any;
  private toast: ToastService;

  constructor(toast: ToastService) {
    this.toast = toast;
    this.interval = setInterval(() => this.tick(), 250);
    this.run();
  }

  ngOnDestroy() { clearInterval(this.interval); }

  async run() {
    this.error.set('');
    try {
      const now = Math.floor(Date.now() / 1000);
      const counter = Math.floor(now / this.period);
      const c1 = await this.totp(this.secret, counter);
      const c2 = await this.totp(this.secret, counter + 1);
      this.code.set(c1);
      this.nextCode.set(c2);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Invalid secret');
      this.code.set('------');
      this.nextCode.set('');
    }
  }

  private tick() {
    const now = Date.now() / 1000;
    const elapsed = now % this.period;
    this.progress.set((elapsed / this.period) * 100);
    this.remaining.set(Math.ceil(this.period - elapsed));
    if (Math.floor(elapsed) === 0) this.run();
  }

  async copy() {
    try { await navigator.clipboard.writeText(this.code()); this.toast.success('Code copied'); } catch {}
  }

  private async totp(secret: string, counter: number): Promise<string> {
    const key = this.base32Decode(secret.replace(/\s+/g, '').toUpperCase());
    if (!key.length) throw new Error('Empty secret');
    const buf = new ArrayBuffer(8);
    const view = new DataView(buf);
    view.setUint32(4, counter, false);
    const cryptoKey = await crypto.subtle.importKey('raw', key.buffer as ArrayBuffer, { name: 'HMAC', hash: this.algo }, false, ['sign']);
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, buf));
    const offset = sig[sig.length - 1] & 0x0f;
    const binary = ((sig[offset] & 0x7f) << 24) | ((sig[offset + 1] & 0xff) << 16) | ((sig[offset + 2] & 0xff) << 8) | (sig[offset + 3] & 0xff);
    const otp = binary % 10 ** this.digits;
    return otp.toString().padStart(this.digits, '0');
  }

  private base32Decode(s: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    s = s.replace(/=+$/, '');
    const bytes: number[] = [];
    let buffer = 0, bits = 0;
    for (const ch of s) {
      const idx = alphabet.indexOf(ch);
      if (idx === -1) throw new Error('Invalid Base32 char: ' + ch);
      buffer = (buffer << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bits -= 8;
        bytes.push((buffer >> bits) & 0xff);
      }
    }
    return new Uint8Array(bytes);
  }
}
