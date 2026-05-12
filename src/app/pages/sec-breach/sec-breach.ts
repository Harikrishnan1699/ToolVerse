import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-sec-breach',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Password Breach Check" subtitle="Has your password leaked? Uses HaveIBeenPwned k-anonymity — only 5 hash characters leave your browser." icon="🛡" color="from-rose-500 to-pink-600" back="/" backLabel="Home" />
    <section class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">

      <div class="card p-5 space-y-3">
        <label class="text-sm font-medium">Password to check</label>
        <div class="flex gap-2">
          <input [type]="show() ? 'text' : 'password'" class="input font-mono flex-1" placeholder="Type or paste a password" [(ngModel)]="pwd" (ngModelChange)="onChange()" />
          <button class="btn-secondary text-sm" (click)="show.set(!show())">{{ show() ? '🙈' : '👁' }}</button>
          <button class="btn-primary" (click)="run()" [disabled]="busy() || !pwd">
            @if (busy()) { Checking… } @else { Check }
          </button>
        </div>
        <p class="text-xs text-slate-500">
          Your password never leaves your device. Only the first 5 characters of its SHA-1 hash are queried; the API returns all suffixes for that prefix and the match is verified locally.
        </p>
      </div>

      @if (result()) {
        <div class="card p-6"
             [class.bg-emerald-50]="result()!.count === 0" [class.dark:bg-emerald-950]="result()!.count === 0"
             [class.border-emerald-200]="result()!.count === 0" [class.dark:border-emerald-900]="result()!.count === 0"
             [class.bg-rose-50]="result()!.count > 0" [class.dark:bg-rose-950]="result()!.count > 0"
             [class.border-rose-200]="result()!.count > 0" [class.dark:border-rose-900]="result()!.count > 0">
          @if (result()!.count === 0) {
            <div class="text-3xl">✅</div>
            <div class="mt-2 font-display text-xl font-bold text-emerald-700 dark:text-emerald-300">Not found in any known breach</div>
            <div class="mt-1 text-sm text-emerald-700/80 dark:text-emerald-300/80">This password hasn't appeared in HaveIBeenPwned's database of over 12 billion compromised credentials. Still — use a unique password per site.</div>
          } @else {
            <div class="text-3xl">⚠️</div>
            <div class="mt-2 font-display text-xl font-bold text-rose-700 dark:text-rose-300">Pwned {{ result()!.count.toLocaleString() }} time(s)</div>
            <div class="mt-1 text-sm text-rose-700/80 dark:text-rose-300/80">This password has been seen in publicly known data breaches. <strong>Change it immediately</strong> anywhere you've used it and never reuse it again.</div>
          }
        </div>
      }

      <div class="card p-5">
        <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Strength tips</div>
        <ul class="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
          <li>Use 14+ characters with a mix of types.</li>
          <li>Never reuse passwords across sites.</li>
          <li>Use a password manager + enable 2FA.</li>
          <li>Toolverse never stores or logs your inputs.</li>
        </ul>
      </div>

      @if (error()) {
        <div class="card p-3 text-sm text-rose-600 border-rose-200">⚠ {{ error() }}</div>
      }
    </section>
  `,
})
export class SecBreach {
  protected pwd = '';
  protected show = signal(false);
  protected busy = signal(false);
  protected result = signal<{ count: number } | null>(null);
  protected error = signal('');

  onChange() { this.result.set(null); this.error.set(''); }

  async run() {
    if (!this.pwd) return;
    this.busy.set(true);
    this.error.set('');
    this.result.set(null);
    try {
      const buf = new TextEncoder().encode(this.pwd);
      const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', buf));
      const hex = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const prefix = hex.slice(0, 5);
      const suffix = hex.slice(5);
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'Add-Padding': 'true' },
      });
      if (!res.ok) throw new Error('HIBP API ' + res.status);
      const text = await res.text();
      const match = text.split('\n').map(l => l.trim()).find(l => l.startsWith(suffix));
      const count = match ? parseInt(match.split(':')[1], 10) : 0;
      this.result.set({ count });
    } catch (e: any) {
      this.error.set(e?.message ?? 'Could not reach HIBP');
    } finally {
      this.busy.set(false);
    }
  }
}
