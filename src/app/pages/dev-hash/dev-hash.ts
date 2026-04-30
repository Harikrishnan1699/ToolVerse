import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import CryptoJS from 'crypto-js';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-hash',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Hash Generator" subtitle="MD5, SHA-1, SHA-256, SHA-512, SHA-3 — for text or files." icon="#" color="from-purple-500 to-violet-600" back="/dev" backLabel="All developer tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-4 flex gap-2">
        <button class="btn-secondary text-xs" [class.!bg-brand-50]="mode()==='text'" (click)="mode.set('text')">Text</button>
        <button class="btn-secondary text-xs" [class.!bg-brand-50]="mode()==='file'" (click)="mode.set('file')">File</button>
      </div>

      @if (mode() === 'text') {
        <div class="card p-4">
          <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Input</label>
          <textarea class="input mt-1 font-mono text-xs h-40" [(ngModel)]="input" (ngModelChange)="run()"></textarea>
        </div>
      } @else {
        <div class="card p-4">
          <input type="file" class="input" (change)="onFile($event)" />
          @if (fileName()) { <div class="mt-3 text-sm text-slate-500">{{ fileName() }} · {{ fileSize() }}</div> }
        </div>
      }

      @if (hashes()['md5']) {
        <div class="card p-4 space-y-3">
          @for (a of algos; track a) {
            <div>
              <div class="flex items-center justify-between">
                <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">{{ a }}</div>
                <button class="btn-ghost text-xs px-2 py-1" (click)="copy(hashes()[a]!)">Copy</button>
              </div>
              <div class="font-mono text-xs break-all bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 mt-1">{{ hashes()[a] }}</div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class DevHash {
  protected mode = signal<'text' | 'file'>('text');
  protected input = '';
  protected hashes = signal<Record<string, string>>({});
  protected fileName = signal('');
  protected fileSize = signal('');
  protected algos = ['md5', 'sha1', 'sha256', 'sha512', 'sha3'];

  run() {
    if (!this.input) { this.hashes.set({}); return; }
    this.hashes.set({
      md5: CryptoJS.MD5(this.input).toString(),
      sha1: CryptoJS.SHA1(this.input).toString(),
      sha256: CryptoJS.SHA256(this.input).toString(),
      sha512: CryptoJS.SHA512(this.input).toString(),
      sha3: CryptoJS.SHA3(this.input).toString(),
    });
  }

  async onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
    this.fileName.set(f.name);
    this.fileSize.set((f.size / 1024).toFixed(1) + ' KB');
    const buf = await f.arrayBuffer();
    const wa = CryptoJS.lib.WordArray.create(buf as any);
    this.hashes.set({
      md5: CryptoJS.MD5(wa).toString(),
      sha1: CryptoJS.SHA1(wa).toString(),
      sha256: CryptoJS.SHA256(wa).toString(),
      sha512: CryptoJS.SHA512(wa).toString(),
      sha3: CryptoJS.SHA3(wa).toString(),
    });
  }

  async copy(s: string) { try { await navigator.clipboard.writeText(s); } catch {} }
}
