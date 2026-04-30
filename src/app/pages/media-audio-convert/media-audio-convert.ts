import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';
import { FfmpegService } from '../../shared/ffmpeg.service';

@Component({
  selector: 'app-media-audio-convert',
  imports: [Dropzone, FormsModule, SectionHeader],
  template: `
    <app-section-header title="Audio Converter" subtitle="Convert audio between MP3, WAV, AAC, OGG, FLAC, M4A." icon="🎵" color="from-violet-500 to-fuchsia-600" back="/media" backLabel="All media tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!file()) {
        <app-dropzone title="Drop an audio or video file" subtitle="Audio is extracted automatically from video files" accept="audio/*,video/*" (files)="pick($event)" />
      } @else {
        <div class="card p-6 space-y-5">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center text-white text-lg">🎵</div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">{{ file()!.name }}</div>
              <div class="text-xs text-slate-500">{{ size() }}</div>
            </div>
            <button class="btn-secondary" (click)="reset()">Change</button>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Format</label>
              <select class="input mt-1" [(ngModel)]="fmt">
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="ogg">OGG (Vorbis)</option>
                <option value="aac">AAC</option>
                <option value="flac">FLAC</option>
                <option value="m4a">M4A</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Bitrate</label>
              <select class="input mt-1" [(ngModel)]="bitrate">
                <option value="96k">96 kbps</option>
                <option value="128k">128 kbps</option>
                <option value="192k">192 kbps</option>
                <option value="256k">256 kbps</option>
                <option value="320k">320 kbps</option>
              </select>
            </div>
          </div>

          <button class="btn-primary" (click)="run()" [disabled]="busy()">
            @if (busy()) { {{ status() }} } @else { Convert & download }
          </button>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class MediaAudioConvert {
  private ffmpeg = inject(FfmpegService);
  protected file = signal<File | null>(null);
  protected size = signal('');
  protected fmt = 'mp3'; protected bitrate = '192k';
  protected busy = signal(false);
  protected status = signal('');
  protected error = signal('');

  pick(list: File[]) {
    const f = list[0]; if (!f) return;
    this.file.set(f); this.size.set((f.size / (1024 * 1024)).toFixed(2) + ' MB');
  }
  reset() { this.file.set(null); }

  async run() {
    if (!this.file()) return;
    this.busy.set(true); this.error.set(''); this.status.set('Loading FFmpeg…');
    try {
      await this.ffmpeg.load();
      this.status.set('Converting…');
      const inputName = 'in' + this.extOf(this.file()!.name);
      const outName = 'out.' + this.fmt;
      await this.ffmpeg.writeFile(inputName, this.file()!);
      const codecArgs = this.fmt === 'wav' || this.fmt === 'flac'
        ? ['-vn']
        : ['-vn', '-b:a', this.bitrate];
      await this.ffmpeg.exec(['-i', inputName, ...codecArgs, outName]);
      const data = await this.ffmpeg.readFile(outName);
      const mime = ({mp3:'audio/mpeg', wav:'audio/wav', ogg:'audio/ogg', aac:'audio/aac', flac:'audio/flac', m4a:'audio/mp4'} as any)[this.fmt];
      const blob = new Blob([data as BlobPart], { type: mime });
      saveAs(blob, (this.file()?.name ?? 'audio').replace(/\.[^.]+$/, '') + '.' + this.fmt);
    } catch (e: any) { this.error.set(e?.message ?? 'Failed.'); }
    finally { this.busy.set(false); }
  }

  private extOf(name: string) {
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(i) : '.bin';
  }
}
