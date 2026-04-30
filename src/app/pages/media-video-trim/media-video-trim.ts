import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';
import { FfmpegService } from '../../shared/ffmpeg.service';

@Component({
  selector: 'app-media-video-trim',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Video Trimmer" subtitle="Cut a clip out of a longer video without re-encoding." icon="✂" color="from-orange-500 to-amber-600" back="/media" backLabel="All media tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) {
        <app-dropzone title="Drop a video" accept="video/*" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <video [src]="url()" class="w-full rounded-xl bg-black" controls></video>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Start (sec)</label>
              <input type="number" min="0" step="0.1" class="input mt-1" [(ngModel)]="start" />
            </div>
            <div>
              <label class="text-sm font-medium">End (sec)</label>
              <input type="number" min="0.1" step="0.1" class="input mt-1" [(ngModel)]="end" />
            </div>
          </div>
          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { {{ status() }} } @else { Trim & download }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class MediaVideoTrim {
  private ffmpeg = inject(FfmpegService);
  protected file = signal<File | null>(null);
  protected url = signal('');
  protected start = 0; protected end = 10;
  protected busy = signal(false);
  protected status = signal('');
  protected error = signal('');

  pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f); this.url.set(URL.createObjectURL(f));
  }

  async run() {
    if (!this.file()) return;
    if (+this.end <= +this.start) { this.error.set('End must be after start.'); return; }
    this.busy.set(true); this.error.set(''); this.status.set('Loading FFmpeg…');
    try {
      await this.ffmpeg.load();
      this.status.set('Trimming…');
      await this.ffmpeg.writeFile('in.mp4', this.file()!);
      const dur = (+this.end - +this.start).toFixed(2);
      await this.ffmpeg.exec(['-ss', String(this.start), '-i', 'in.mp4', '-t', dur, '-c', 'copy', 'out.mp4']);
      const data = await this.ffmpeg.readFile('out.mp4');
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' });
      saveAs(blob, (this.file()?.name ?? 'clip').replace(/\.[^.]+$/, '') + '-trimmed.mp4');
    } catch (e: any) { this.error.set(e?.message ?? 'Failed.'); }
    finally { this.busy.set(false); }
  }
}
