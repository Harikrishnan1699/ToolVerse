import { Component, signal } from '@angular/core';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-image-bg-remove',
  imports: [Dropzone, SectionHeader],
  template: `
    <app-section-header title="Background Remover" subtitle="Erase image backgrounds with on-device AI — runs entirely in your browser." icon="✂" color="from-rose-500 to-pink-600" back="/image" backLabel="All image tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) {
        <app-dropzone title="Drop an image" subtitle="First use downloads the AI model (~50 MB)" accept="image/*" (files)="pick($event)" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-5">
          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Original</div>
              <button class="btn-secondary text-xs" (click)="reset()">Change</button>
            </div>
            <img [src]="url()" class="w-full rounded-xl border border-slate-200 dark:border-slate-700" />
          </div>

          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Result</div>
              @if (resultUrl()) { <button class="btn-ghost text-xs px-2 py-1" (click)="download()">Download PNG</button> }
            </div>
            @if (busy()) {
              <div class="aspect-square rounded-xl border border-dashed border-slate-300 dark:border-slate-700 grid place-items-center">
                <div class="text-center">
                  <div class="text-3xl animate-pulse">🧠</div>
                  <div class="mt-2 text-sm text-slate-500">{{ status() }}</div>
                  <div class="mt-1 text-xs text-slate-400">First run downloads the model (~50 MB)</div>
                </div>
              </div>
            } @else if (resultUrl()) {
              <div class="rounded-xl bg-[length:20px_20px] bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%,#e2e8f0),linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%,#e2e8f0)] bg-[position:0_0,10px_10px] dark:bg-[linear-gradient(45deg,#334155_25%,transparent_25%,transparent_75%,#334155_75%,#334155),linear-gradient(45deg,#334155_25%,transparent_25%,transparent_75%,#334155_75%,#334155)] p-1">
                <img [src]="resultUrl()" class="w-full rounded-lg" />
              </div>
            } @else {
              <button class="btn-primary w-full" (click)="run()">Remove background</button>
            }
            @if (error()) { <div class="mt-3 text-sm text-rose-600">{{ error() }}</div> }
          </div>
        </div>
      }
    </section>
  `,
})
export class ImageBgRemove {
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected resultUrl = signal('');
  protected busy = signal(false);
  protected status = signal('Loading model…');
  protected error = signal('');

  pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.url.set(URL.createObjectURL(f));
    this.resultUrl.set(''); this.error.set('');
  }
  reset() {
    if (this.url()) URL.revokeObjectURL(this.url());
    if (this.resultUrl()) URL.revokeObjectURL(this.resultUrl());
    this.file.set(null); this.url.set(''); this.resultUrl.set('');
  }

  async run() {
    if (!this.file()) return;
    this.busy.set(true); this.error.set(''); this.status.set('Loading model…');
    try {
      const { removeBackground }: any = await import('@imgly/background-removal');
      const blob = await removeBackground(this.file()!, {
        progress: (key: string, current: number, total: number) => {
          this.status.set(`${key}: ${Math.round((current / total) * 100)}%`);
        },
      });
      this.resultUrl.set(URL.createObjectURL(blob));
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed.');
    } finally {
      this.busy.set(false);
    }
  }

  async download() {
    const blob = await fetch(this.resultUrl()).then(r => r.blob());
    const name = (this.file()?.name ?? 'image').replace(/\.[^.]+$/, '') + '-no-bg.png';
    saveAs(blob, name);
  }
}
