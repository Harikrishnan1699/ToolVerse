import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-base64',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Base64 Encoder / Decoder" subtitle="Convert text or files to and from Base64." icon="64" color="from-sky-500 to-cyan-600" back="/dev" backLabel="All developer tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-4">
        <div class="flex gap-2">
          <button class="btn-secondary text-xs" [class.!bg-brand-50]="mode()==='text'" (click)="mode.set('text')">Text</button>
          <button class="btn-secondary text-xs" [class.!bg-brand-50]="mode()==='file'" (click)="mode.set('file')">File</button>
        </div>
      </div>

      @if (mode() === 'text') {
        <div class="grid lg:grid-cols-2 gap-4">
          <div class="card p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plain text</div>
              <button class="btn-ghost text-xs px-2 py-1" (click)="encode()">→ Encode</button>
            </div>
            <textarea class="input font-mono text-xs h-72" [(ngModel)]="text"></textarea>
          </div>
          <div class="card p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Base64</div>
              <div class="flex gap-1">
                <button class="btn-ghost text-xs px-2 py-1" (click)="decode()">← Decode</button>
                <button class="btn-ghost text-xs px-2 py-1" (click)="copyB64()">Copy</button>
              </div>
            </div>
            <textarea class="input font-mono text-xs h-72" [(ngModel)]="b64"></textarea>
          </div>
        </div>
        @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
      } @else {
        <div class="card p-4">
          <input type="file" class="input" (change)="onFile($event)" />
          @if (fileB64()) {
            <div class="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div><div class="text-slate-500">Filename</div><div class="font-mono">{{ fileName() }}</div></div>
              <div><div class="text-slate-500">Size</div><div>{{ fileSize() }}</div></div>
            </div>
            <textarea class="input font-mono text-xs h-72 mt-3" readonly [value]="fileB64()"></textarea>
            <div class="mt-3 flex gap-2">
              <button class="btn-secondary text-xs" (click)="copyFileB64()">Copy</button>
              <button class="btn-secondary text-xs" (click)="downloadDataUrl()">Download as data: URL</button>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class DevBase64 {
  protected mode = signal<'text' | 'file'>('text');
  protected text = '';
  protected b64 = '';
  protected error = signal('');
  protected fileB64 = signal('');
  protected fileName = signal('');
  protected fileSize = signal('');
  protected fileType = signal('');

  encode() {
    try { this.b64 = btoa(unescape(encodeURIComponent(this.text))); this.error.set(''); }
    catch (e: any) { this.error.set('Encode failed: ' + e?.message); }
  }
  decode() {
    try { this.text = decodeURIComponent(escape(atob(this.b64))); this.error.set(''); }
    catch { this.error.set('Decode failed: not valid Base64.'); }
  }
  async copyB64() { try { await navigator.clipboard.writeText(this.b64); } catch {} }
  async copyFileB64() { try { await navigator.clipboard.writeText(this.fileB64()); } catch {} }

  async onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
    this.fileName.set(f.name);
    this.fileSize.set((f.size / 1024).toFixed(1) + ' KB');
    this.fileType.set(f.type || 'application/octet-stream');
    const reader = new FileReader();
    reader.onload = () => this.fileB64.set((reader.result as string));
    reader.readAsDataURL(f);
  }

  downloadDataUrl() {
    const a = document.createElement('a');
    a.href = this.fileB64();
    a.download = this.fileName() || 'file';
    a.click();
  }
}
