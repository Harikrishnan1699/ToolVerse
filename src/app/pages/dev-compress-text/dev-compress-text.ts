import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-compress-text',
  imports: [FormsModule, Dropzone, SectionHeader],
  template: `
    <app-section-header title="Gzip / Deflate" subtitle="Compress or decompress text & files using the browser's CompressionStream." icon="🗜" color="from-emerald-500 to-teal-600" back="/dev" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-2 flex gap-1">
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="mode() === 'text'" (click)="mode.set('text')">Text</button>
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="mode() === 'file'" (click)="mode.set('file')">File</button>
      </div>

      <div class="card p-6 space-y-4">
        <div class="flex flex-wrap gap-2 text-xs">
          <label>Algorithm:</label>
          <select class="input !w-auto !py-1" [(ngModel)]="algo">
            <option value="gzip">gzip</option>
            <option value="deflate">deflate</option>
            <option value="deflate-raw">deflate-raw</option>
          </select>
        </div>

        @if (mode() === 'text') {
          <div class="grid lg:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-slate-500 uppercase">Input</label>
              <textarea class="input mt-1 font-mono text-xs h-72" [(ngModel)]="text"></textarea>
              <div class="mt-2 flex gap-2">
                <button class="btn-primary text-xs flex-1" (click)="compressText()">Compress</button>
                <button class="btn-secondary text-xs flex-1" (click)="decompressText()">Decompress</button>
              </div>
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-500 uppercase">Output (Base64)</label>
              <textarea class="input mt-1 font-mono text-xs h-72" [(ngModel)]="output"></textarea>
              @if (stats()) { <div class="text-xs text-slate-500 mt-2">{{ stats() }}</div> }
            </div>
          </div>
        } @else {
          @if (!file()) { <app-dropzone title="Drop a file" (files)="pickFile($event)" accept="*" /> }
          @else {
            <div>
              <div class="flex items-center gap-3 mb-3">
                <div class="font-semibold flex-1 truncate">{{ file()!.name }}</div>
                <button class="btn-secondary text-xs" (click)="file.set(null)">Change</button>
              </div>
              <div class="flex gap-2">
                <button class="btn-primary text-xs flex-1" (click)="compressFile()">Compress & download</button>
                <button class="btn-secondary text-xs flex-1" (click)="decompressFile()">Decompress & download</button>
              </div>
              @if (stats()) { <div class="text-xs text-slate-500 mt-3">{{ stats() }}</div> }
            </div>
          }
        }
        @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
      </div>
    </section>
  `,
})
export class DevCompressText {
  protected mode = signal<'text' | 'file'>('text');
  protected algo: 'gzip' | 'deflate' | 'deflate-raw' = 'gzip';
  protected text = '';
  protected output = '';
  protected stats = signal('');
  protected error = signal('');
  protected file = signal<File | null>(null);

  pickFile(list: File[]) { this.file.set(list[0] ?? null); }

  private async streamThrough(input: BlobPart, transform: 'CompressionStream' | 'DecompressionStream'): Promise<Blob> {
    const stream = (new Response(new Blob([input])).body)!.pipeThrough(new (window as any)[transform](this.algo));
    return new Response(stream).blob();
  }

  async compressText() {
    this.error.set('');
    try {
      const blob = await this.streamThrough(this.text, 'CompressionStream');
      const buf = await blob.arrayBuffer();
      this.output = btoa(String.fromCharCode(...new Uint8Array(buf)));
      this.stats.set(`Original: ${this.text.length} chars · Compressed: ${blob.size} bytes · Ratio: ${(blob.size / Math.max(1, this.text.length) * 100).toFixed(1)}%`);
    } catch (e: any) { this.error.set(e?.message ?? 'Compress failed'); }
  }

  async decompressText() {
    this.error.set('');
    try {
      const bin = atob(this.output);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = await this.streamThrough(arr, 'DecompressionStream');
      this.text = await blob.text();
      this.stats.set(`Decompressed to ${this.text.length} chars`);
    } catch (e: any) { this.error.set('Decompress failed — invalid input'); }
  }

  async compressFile() {
    if (!this.file()) return;
    this.error.set('');
    try {
      const buf = await this.file()!.arrayBuffer();
      const blob = await this.streamThrough(buf, 'CompressionStream');
      const ext = this.algo === 'gzip' ? '.gz' : '.zz';
      saveAs(blob, this.file()!.name + ext);
      this.stats.set(`${this.file()!.size} B → ${blob.size} B (${((1 - blob.size / this.file()!.size) * 100).toFixed(1)}% saved)`);
    } catch (e: any) { this.error.set(e?.message ?? 'Compress failed'); }
  }

  async decompressFile() {
    if (!this.file()) return;
    this.error.set('');
    try {
      const buf = await this.file()!.arrayBuffer();
      const blob = await this.streamThrough(buf, 'DecompressionStream');
      const name = this.file()!.name.replace(/\.(gz|zz)$/, '') || 'decompressed.bin';
      saveAs(blob, name);
      this.stats.set(`${this.file()!.size} B → ${blob.size} B decompressed`);
    } catch (e: any) { this.error.set('Decompress failed — file may be corrupted'); }
  }
}
