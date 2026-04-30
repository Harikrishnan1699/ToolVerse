import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';
import { FfmpegService } from '../../shared/ffmpeg.service';

@Component({
  selector: 'app-media-video-compress',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Video Compressor" subtitle="Re-encode video at a lower bitrate to shrink it dramatically." icon="🎞" color="from-emerald-500 to-teal-600" back="/media" backLabel="All media tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) {
        <app-dropzone title="Drop a video" subtitle="MP4 / WebM / MOV / MKV" accept="video/*" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white text-lg">🎞</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
              <div class="text-xs text-slate-500">{{ origSize() }}</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>

          <div>
            <label class="text-sm font-medium">Quality preset</label>
            <div class="grid grid-cols-3 gap-3 mt-2">
              <button class="card p-4 text-center hover:shadow-glow" [class.ring-2]="quality()==='low'" [class.ring-brand-500]="quality()==='low'" (click)="quality.set('low')">
                <div class="font-semibold">Smallest</div>
                <div class="text-xs text-slate-500">CRF 32 · 480p max</div>
              </button>
              <button class="card p-4 text-center hover:shadow-glow" [class.ring-2]="quality()==='medium'" [class.ring-brand-500]="quality()==='medium'" (click)="quality.set('medium')">
                <div class="font-semibold">Balanced</div>
                <div class="text-xs text-slate-500">CRF 28 · 720p max</div>
              </button>
              <button class="card p-4 text-center hover:shadow-glow" [class.ring-2]="quality()==='high'" [class.ring-brand-500]="quality()==='high'" (click)="quality.set('high')">
                <div class="font-semibold">High</div>
                <div class="text-xs text-slate-500">CRF 23 · 1080p max</div>
              </button>
            </div>
          </div>

          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { {{ status() }} } @else { Compress & download }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }

          @if (result()) {
            <div class="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-sm">
              <div class="font-semibold text-emerald-800 dark:text-emerald-200">Done!</div>
              <div class="text-emerald-700 dark:text-emerald-300">Original: {{ origSize() }} → New: {{ result()!.size }} · Saved {{ result()!.savedPct }}%</div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class MediaVideoCompress {
  private ffmpeg = inject(FfmpegService);
  protected file = signal<File | null>(null);
  protected origSize = signal('');
  protected quality = signal<'low' | 'medium' | 'high'>('medium');
  protected busy = signal(false);
  protected status = signal('');
  protected error = signal('');
  protected result = signal<{size: string; savedPct: number} | null>(null);

  pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f);
    this.origSize.set((f.size / (1024 * 1024)).toFixed(2) + ' MB');
    this.result.set(null);
  }
  reset() { this.file.set(null); this.result.set(null); }

  async run() {
    if (!this.file()) return;
    this.busy.set(true); this.error.set(''); this.result.set(null); this.status.set('Loading FFmpeg…');
    try {
      const presets = {
        low: { crf: 32, scale: 'scale=\'min(854,iw)\':-2' },
        medium: { crf: 28, scale: 'scale=\'min(1280,iw)\':-2' },
        high: { crf: 23, scale: 'scale=\'min(1920,iw)\':-2' },
      } as const;
      const p = presets[this.quality()];
      await this.ffmpeg.load();
      this.status.set('Encoding…');
      await this.ffmpeg.writeFile('in.mp4', this.file()!);
      await this.ffmpeg.exec(['-i', 'in.mp4', '-vf', p.scale, '-c:v', 'libx264', '-crf', String(p.crf), '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '128k', 'out.mp4']);
      const data = await this.ffmpeg.readFile('out.mp4');
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' });
      const savedPct = Math.max(0, Math.round((1 - blob.size / this.file()!.size) * 100));
      this.result.set({ size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB', savedPct });
      saveAs(blob, (this.file()?.name ?? 'video').replace(/\.[^.]+$/, '') + '-compressed.mp4');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed.');
    } finally {
      this.busy.set(false);
    }
  }
}
