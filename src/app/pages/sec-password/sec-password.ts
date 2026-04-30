import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-sec-password',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Password Tools" subtitle="Generate strong passwords and check the strength of any password." icon="🔑" color="from-emerald-500 to-teal-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="grid lg:grid-cols-2 gap-5">
        <div class="card p-6 space-y-4">
          <div class="text-xs font-semibold text-slate-500 uppercase">Generator</div>
          <div class="font-mono text-lg bg-slate-50 dark:bg-slate-800/40 rounded-lg p-4 break-all">{{ pwd() }}</div>
          <div class="flex gap-2">
            <button class="btn-primary flex-1" (click)="gen()">Regenerate</button>
            <button class="btn-secondary" (click)="copy()">Copy</button>
          </div>
          <div>
            <label class="text-sm font-medium">Length: {{ length }}</label>
            <input type="range" min="6" max="64" class="w-full" [(ngModel)]="length" (ngModelChange)="gen()" />
          </div>
          <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="useLower" (ngModelChange)="gen()" /> Lowercase (a-z)</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="useUpper" (ngModelChange)="gen()" /> Uppercase (A-Z)</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="useDigits" (ngModelChange)="gen()" /> Digits (0-9)</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="useSymbols" (ngModelChange)="gen()" /> Symbols (!@#$…)</label>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="excludeAmbig" (ngModelChange)="gen()" /> Exclude ambiguous (l, 1, O, 0…)</label>
          </div>
        </div>
        <div class="card p-6 space-y-4">
          <div class="text-xs font-semibold text-slate-500 uppercase">Strength checker</div>
          <input class="input font-mono" [(ngModel)]="check" placeholder="Type any password…" />
          @if (check) {
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-sm font-semibold" [class]="strength().color">{{ strength().label }}</span>
                <span class="text-xs text-slate-500">Score {{ strength().score }}/100</span>
              </div>
              <div class="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div class="h-full transition-all" [class]="strength().bar" [style.width.%]="strength().score"></div>
              </div>
              <ul class="mt-3 space-y-1 text-xs">
                @for (c of strength().checks; track c.label) {
                  <li class="flex items-center gap-2" [class.text-emerald-600]="c.ok" [class.text-slate-400]="!c.ok">
                    <span>{{ c.ok ? '✓' : '○' }}</span> {{ c.label }}
                  </li>
                }
              </ul>
              <div class="mt-3 text-xs text-slate-500">Estimated crack time: <span class="font-semibold">{{ strength().crack }}</span></div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class SecPassword {
  protected length = 16;
  protected useLower = true; protected useUpper = true; protected useDigits = true; protected useSymbols = true;
  protected excludeAmbig = false;
  protected pwd = signal('');
  protected check = '';
  protected strength = computed(() => this.compute(this.check));

  constructor() { this.gen(); }

  gen() {
    let chars = '';
    if (this.useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (this.useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (this.useDigits) chars += '0123456789';
    if (this.useSymbols) chars += '!@#$%^&*()_+-=[]{};:,.<>?';
    if (this.excludeAmbig) chars = chars.replace(/[lI1O0o]/g, '');
    if (!chars) { this.pwd.set(''); return; }
    const arr = new Uint32Array(+this.length);
    crypto.getRandomValues(arr);
    let p = '';
    for (let i = 0; i < +this.length; i++) p += chars[arr[i] % chars.length];
    this.pwd.set(p);
  }

  async copy() { try { await navigator.clipboard.writeText(this.pwd()); } catch {} }

  private compute(p: string) {
    if (!p) return { score: 0, label: '', color: '', bar: '', checks: [], crack: '' };
    const checks = [
      { label: 'At least 8 characters', ok: p.length >= 8 },
      { label: 'At least 12 characters', ok: p.length >= 12 },
      { label: 'Lowercase + uppercase', ok: /[a-z]/.test(p) && /[A-Z]/.test(p) },
      { label: 'Contains digits', ok: /\d/.test(p) },
      { label: 'Contains symbols', ok: /[^a-zA-Z0-9]/.test(p) },
      { label: 'No common patterns', ok: !/^(123|abc|password|qwerty)/i.test(p) },
    ];
    const score = Math.min(100, checks.filter(c => c.ok).length * 17);
    let label = 'Very weak', color = 'text-rose-600', bar = 'bg-rose-500';
    if (score >= 85) { label = 'Excellent'; color = 'text-emerald-600'; bar = 'bg-emerald-500'; }
    else if (score >= 65) { label = 'Strong'; color = 'text-green-600'; bar = 'bg-green-500'; }
    else if (score >= 45) { label = 'Fair'; color = 'text-amber-600'; bar = 'bg-amber-500'; }
    else if (score >= 25) { label = 'Weak'; color = 'text-orange-600'; bar = 'bg-orange-500'; }
    const charset = (/[a-z]/.test(p) ? 26 : 0) + (/[A-Z]/.test(p) ? 26 : 0) + (/\d/.test(p) ? 10 : 0) + (/[^a-zA-Z0-9]/.test(p) ? 32 : 0);
    const guesses = Math.pow(charset || 1, p.length);
    const seconds = guesses / 1e10;
    let crack: string;
    if (seconds < 60) crack = 'instant';
    else if (seconds < 3600) crack = Math.round(seconds / 60) + ' minutes';
    else if (seconds < 86400) crack = Math.round(seconds / 3600) + ' hours';
    else if (seconds < 31536000) crack = Math.round(seconds / 86400) + ' days';
    else crack = (seconds / 31536000).toExponential(1) + ' years';
    return { score, label, color, bar, checks, crack };
  }
}
