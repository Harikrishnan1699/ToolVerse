import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';
import { FfmpegService } from '../../shared/ffmpeg.service';

@Component({
  selector: 'app-media-video-gif',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Video to GIF" subtitle="Convert any short video clip into an animated GIF." icon="🎬" color="from-pink-500 to-rose-600" back="/media" backLabel="All media tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) {
        <app-dropzone title="Drop a video file" subtitle="MP4, WebM, MOV — first run downloads the FFmpeg WASM core (~30 MB)" accept="video/*" (files)="pick($event)" />
      } @else {
        <div class="grid lg:grid-cols-2 gap-5">
          <div class="card p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</div>
              <button class="btn-secondary text-xs" (click)="reset()">Change</button>
            </div>
            <video [src]="url()" class="w-full rounded-xl bg-black" controls></video>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-500">Start (sec)</label>
                <input type="number" min="0" step="0.5" class="input mt-1" [(ngModel)]="start" />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500">Duration (sec)</label>
                <input type="number" min="0.5" max="30" step="0.5" class="input mt-1" [(ngModel)]="duration" />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500">Width (px)</label>
                <input type="number" min="160" max="1280" step="10" class="input mt-1" [(ngModel)]="width" />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500">FPS</label>
                <input type="number" min="5" max="30" class="input mt-1" [(ngModel)]="fps" />
              </div>
            </div>

            <button class="btn-primary w-full" (click)="run()" [disabled]="busy()">
              @if (busy()) { {{ status() }} } @else { Convert to GIF }
            </button>
            @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
          </div>

          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Result</div>
              @if (resultUrl()) { <button class="btn-ghost text-xs px-2 py-1" (click)="download()">Download GIF</button> }
            </div>
            @if (resultUrl()) {
              <img [src]="resultUrl()" class="w-full rounded-xl border border-slate-200 dark:border-slate-700" />
              <div class="mt-2 text-xs text-slate-500">{{ resultSize() }}</div>
            } @else {
              <div class="aspect-video rounded-xl border border-dashed border-slate-300 dark:border-slate-700 grid place-items-center text-sm text-slate-400">
                GIF will appear here
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class MediaVideoGif {
  private ffmpeg = inject(FfmpegService);
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected resultUrl = signal('');
  protected resultSize = signal('');
  protected busy = signal(false);
  protected status = signal('');
  protected error = signal('');
  protected start = 0; protected duration = 4; protected width = 480; protected fps = 12;

  pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f); this.url.set(URL.createObjectURL(f));
    this.resultUrl.set(''); this.error.set('');
  }
  reset() {
    if (this.url()) URL.revokeObjectURL(this.url());
    if (this.resultUrl()) URL.revokeObjectURL(this.resultUrl());
    this.file.set(null); this.url.set(''); this.resultUrl.set('');
  }

  async run() {
    if (!this.file()) return;
    this.busy.set(true); this.error.set(''); this.status.set('Loading FFmpeg…');
    try {
      await this.ffmpeg.load();
      this.status.set('Encoding GIF…');
      await this.ffmpeg.writeFile('in.mp4', this.file()!);
      await this.ffmpeg.exec([
        '-i', 'in.mp4',
        '-ss', String(this.start),
        '-t', String(this.duration),
        '-vf', `fps=${this.fps},scale=${this.width}:-1:flags=lanczos`,
        '-loop', '0',
        'out.gif'
      ]);
      const data = await this.ffmpeg.readFile('out.gif');
      const blob = new Blob([data as BlobPart], { type: 'image/gif' });
      this.resultUrl.set(URL.createObjectURL(blob));
      this.resultSize.set((blob.size / 1024).toFixed(1) + ' KB');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed.');
    } finally {
      this.busy.set(false);
    }
  }

  async download() {
    const blob = await fetch(this.resultUrl()).then(r => r.blob());
    saveAs(blob, (this.file()?.name ?? 'video').replace(/\.[^.]+$/, '') + '.gif');
  }
}
