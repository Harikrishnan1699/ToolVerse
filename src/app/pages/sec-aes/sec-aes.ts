import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import CryptoJS from 'crypto-js';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-sec-aes',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="AES Encrypt / Decrypt" subtitle="Encrypt or decrypt text with AES-256 and a passphrase." icon="🔐" color="from-violet-500 to-purple-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-6 space-y-4">
        <div>
          <label class="text-sm font-medium">Passphrase</label>
          <input type="password" class="input mt-1 font-mono" [(ngModel)]="key" placeholder="Strong secret only you know" />
        </div>
        <div class="grid lg:grid-cols-2 gap-4">
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-slate-500 uppercase">Plain text</label>
              <button class="btn-ghost text-xs px-2 py-1" (click)="encrypt()">→ Encrypt</button>
            </div>
            <textarea class="input font-mono text-xs h-72" [(ngModel)]="plain"></textarea>
          </div>
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-slate-500 uppercase">Cipher text</label>
              <button class="btn-ghost text-xs px-2 py-1" (click)="decrypt()">← Decrypt</button>
            </div>
            <textarea class="input font-mono text-xs h-72" [(ngModel)]="cipher"></textarea>
          </div>
        </div>
        @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        <div class="text-xs text-slate-500">⚠ Don't lose your passphrase — there's no way to recover it.</div>
      </div>
    </section>
  `,
})
export class SecAes {
  protected key = '';
  protected plain = '';
  protected cipher = '';
  protected error = signal('');

  encrypt() {
    if (!this.key) { this.error.set('Set a passphrase first.'); return; }
    try { this.cipher = CryptoJS.AES.encrypt(this.plain, this.key).toString(); this.error.set(''); }
    catch (e: any) { this.error.set(e?.message ?? 'Encrypt failed'); }
  }
  decrypt() {
    if (!this.key) { this.error.set('Set a passphrase first.'); return; }
    try {
      const out = CryptoJS.AES.decrypt(this.cipher, this.key).toString(CryptoJS.enc.Utf8);
      if (!out) throw new Error('Wrong passphrase or invalid cipher.');
      this.plain = out; this.error.set('');
    } catch (e: any) { this.error.set('Wrong passphrase or invalid cipher.'); }
  }
}
