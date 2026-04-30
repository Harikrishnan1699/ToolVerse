import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-jwt',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="JWT Decoder" subtitle="Decode and inspect a JSON Web Token — header, payload and expiry." icon="JWT" color="from-rose-500 to-fuchsia-600" back="/dev" backLabel="All developer tools" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-2 gap-4">
      <div class="card p-4">
        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Token</label>
        <textarea class="input mt-1 font-mono text-xs h-[420px]" [(ngModel)]="token" (ngModelChange)="decode()" placeholder="Paste JWT here…"></textarea>
        <div class="mt-3 text-xs text-slate-500">⚠ Decoding only — signature is NOT verified. Never paste production tokens.</div>
      </div>
      <div class="card p-4 space-y-4">
        @if (error()) {
          <div class="text-sm text-rose-600">{{ error() }}</div>
        } @else if (header()) {
          <div>
            <div class="text-xs font-semibold text-rose-500 uppercase tracking-wider">Header</div>
            <pre class="mt-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 text-xs font-mono overflow-auto">{{ header() }}</pre>
          </div>
          <div>
            <div class="text-xs font-semibold text-fuchsia-500 uppercase tracking-wider">Payload</div>
            <pre class="mt-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 text-xs font-mono overflow-auto">{{ payload() }}</pre>
          </div>
          @if (expInfo()) {
            <div class="text-xs">
              <span class="font-semibold text-slate-500">Expires:</span>
              <span [class.text-emerald-600]="expInfo()!.valid" [class.text-rose-600]="!expInfo()!.valid"> {{ expInfo()!.text }}</span>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class DevJwt {
  protected token = '';
  protected header = signal('');
  protected payload = signal('');
  protected error = signal('');
  protected expInfo = signal<{valid: boolean; text: string} | null>(null);

  decode() {
    this.error.set(''); this.header.set(''); this.payload.set(''); this.expInfo.set(null);
    if (!this.token.trim()) return;
    const parts = this.token.split('.');
    if (parts.length < 2) { this.error.set('Not a JWT (expected 3 dot-separated parts).'); return; }
    try {
      const h = JSON.parse(this.b64url(parts[0]));
      const p = JSON.parse(this.b64url(parts[1]));
      this.header.set(JSON.stringify(h, null, 2));
      this.payload.set(JSON.stringify(p, null, 2));
      if (p.exp) {
        const expDate = new Date(p.exp * 1000);
        const valid = expDate.getTime() > Date.now();
        this.expInfo.set({ valid, text: expDate.toLocaleString() + (valid ? ' (active)' : ' (expired)') });
      }
    } catch (e: any) {
      this.error.set('Decode failed: ' + (e?.message ?? 'malformed'));
    }
  }

  private b64url(s: string) {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    return decodeURIComponent(escape(atob(b64 + pad)));
  }
}
