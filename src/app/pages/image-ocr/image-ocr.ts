import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-image-ocr',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Image to Text (OCR)" subtitle="Extract text from images using on-device Tesseract.js — works in 100+ languages." icon="A" color="from-indigo-500 to-purple-600" back="/image" backLabel="All image tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) {
        <app-dropzone title="Drop an image" subtitle="JPG, PNG, WebP — first run downloads ~5 MB of language data" accept="image/*" (files)="pick($event)" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-5">
          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Image</div>
              <button class="btn-secondary text-xs" (click)="reset()">Change</button>
            </div>
            <img [src]="url()" class="w-full rounded-xl border border-slate-200 dark:border-slate-700" />
            <div class="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-500">Language</label>
                <select class="input mt-1" [(ngModel)]="lang">
                  <option value="eng">English</option>
                  <option value="hin">Hindi</option>
                  <option value="fra">French</option>
                  <option value="deu">German</option>
                  <option value="spa">Spanish</option>
                  <option value="ita">Italian</option>
                  <option value="por">Portuguese</option>
                  <option value="rus">Russian</option>
                  <option value="jpn">Japanese</option>
                  <option value="chi_sim">Chinese (Simp.)</option>
                  <option value="ara">Arabic</option>
                </select>
              </div>
              <button class="btn-primary self-end" (click)="run()" [disabled]="busy()">
                @if (busy()) { Recognising… {{ progress() }}% } @else { Extract text }
              </button>
            </div>
          </div>
          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extracted text</div>
              <button class="btn-ghost text-xs px-2 py-1" (click)="copy()" [disabled]="!text()">Copy</button>
            </div>
            <textarea class="input font-mono text-xs h-96" readonly [value]="text()"></textarea>
            @if (text()) { <div class="mt-2 text-xs text-slate-500">{{ text().length }} chars</div> }
            @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
          </div>
        </div>
      }
    </section>
  `,
})
export class ImageOcr {
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected lang = 'eng';
  protected busy = signal(false);
  protected progress = signal(0);
  protected text = signal('');
  protected error = signal('');

  pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.url.set(URL.createObjectURL(f));
    this.text.set(''); this.error.set('');
  }
  reset() {
    if (this.url()) URL.revokeObjectURL(this.url());
    this.file.set(null); this.url.set(''); this.text.set('');
  }

  async run() {
    if (!this.file()) return;
    this.busy.set(true); this.error.set(''); this.progress.set(0); this.text.set('');
    try {
      const Tesseract: any = await import('tesseract.js');
      const worker = await Tesseract.createWorker(this.lang, 1, {
        logger: (m: any) => { if (m.status === 'recognizing text') this.progress.set(Math.round(m.progress * 100)); }
      });
      const { data } = await worker.recognize(this.file()!);
      this.text.set(data.text);
      await worker.terminate();
    } catch (e: any) {
      this.error.set(e?.message ?? 'OCR failed.');
    } finally {
      this.busy.set(false);
    }
  }

  async copy() { try { await navigator.clipboard.writeText(this.text()); } catch {} }
}
