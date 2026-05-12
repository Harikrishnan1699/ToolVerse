import { Component, ElementRef, OnDestroy, ViewChild, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-screen-recorder',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Screen Recorder" subtitle="Record your screen, window or tab — with mic & system audio. Saves locally as WebM." icon="⏺" color="from-rose-500 to-pink-600" back="/" backLabel="Home" />
    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="card p-6 space-y-5">
        <div class="grid sm:grid-cols-3 gap-3">
          <label class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input type="checkbox" [(ngModel)]="withMic" /> Microphone
          </label>
          <label class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
            <input type="checkbox" [(ngModel)]="withSystemAudio" /> System audio (if supported)
          </label>
          <div class="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <label class="text-sm font-medium">Quality</label>
            <select class="input flex-1 !py-1 !px-2 text-sm" [(ngModel)]="bitrate">
              <option [ngValue]="2_500_000">SD (2.5 Mbps)</option>
              <option [ngValue]="5_000_000">HD (5 Mbps)</option>
              <option [ngValue]="10_000_000">Full HD (10 Mbps)</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2 items-center">
          @if (!recording()) {
            <button class="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-rose-600/30 transition flex items-center gap-2" (click)="start()">
              ⏺ Start recording
            </button>
          } @else {
            <button class="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition flex items-center gap-2" (click)="stop()">
              ⏹ Stop ({{ elapsed() }})
            </button>
            @if (!paused()) {
              <button class="btn-secondary" (click)="pause()">⏸ Pause</button>
            } @else {
              <button class="btn-secondary" (click)="resume()">▶ Resume</button>
            }
          }
        </div>

        @if (error()) { <div class="text-sm text-rose-600">⚠ {{ error() }}</div> }

        @if (recording()) {
          <div class="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 flex items-center gap-3">
            <span class="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
            <span class="font-mono text-rose-700 dark:text-rose-300">REC · {{ elapsed() }}</span>
          </div>
        }

        @if (videoUrl()) {
          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-sm font-semibold">Latest recording</div>
              <div class="text-xs text-slate-500">{{ sizeLabel() }}</div>
            </div>
            <video #vid [src]="videoUrl()!" controls class="w-full rounded-xl bg-black"></video>
            <div class="flex flex-wrap gap-2 mt-3">
              <button class="btn-primary" (click)="download()">⬇ Download WebM</button>
              <button class="btn-secondary" (click)="discard()">🗑 Discard</button>
            </div>
          </div>
        }

        <div class="text-xs text-slate-500 leading-relaxed">
          Uses <code>navigator.mediaDevices.getDisplayMedia()</code> — Chrome, Edge, Firefox. System audio capture is browser-dependent (Chrome supports it for tab/screen sharing).
        </div>
      </div>
    </section>
  `,
})
export class ScreenRecorder implements OnDestroy {
  protected withMic = false;
  protected withSystemAudio = true;
  protected bitrate = 5_000_000;
  protected recording = signal(false);
  protected paused = signal(false);
  protected error = signal('');
  protected videoUrl = signal<string | null>(null);
  protected sizeBytes = signal(0);
  protected startedAt = signal(0);
  protected tickMs = signal(0);

  protected elapsed = computed(() => {
    const s = Math.floor(this.tickMs() / 1000);
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  });

  protected sizeLabel = computed(() => {
    const b = this.sizeBytes();
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  });

  private mediaRecorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private stream?: MediaStream;
  private micStream?: MediaStream;
  private tickInterval?: any;

  constructor(private toast: ToastService) {}

  async start() {
    this.error.set('');
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 } as any,
        audio: this.withSystemAudio,
      });
      const tracks: MediaStreamTrack[] = displayStream.getTracks();

      if (this.withMic) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micStream.getAudioTracks().forEach(t => tracks.push(t));
      }

      this.stream = new MediaStream(tracks);
      this.chunks = [];

      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mime,
        videoBitsPerSecond: this.bitrate,
      });
      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size) this.chunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => this.finalize(mime);
      this.mediaRecorder.start(1000);

      // Stop if user clicks browser's "Stop sharing"
      displayStream.getVideoTracks()[0].addEventListener('ended', () => this.stop());

      this.recording.set(true);
      this.paused.set(false);
      this.startedAt.set(Date.now());
      this.tickMs.set(0);
      this.tickInterval = setInterval(() => this.tickMs.set(Date.now() - this.startedAt()), 200);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Recording was cancelled or denied.');
    }
  }

  pause() {
    this.mediaRecorder?.pause();
    this.paused.set(true);
    clearInterval(this.tickInterval);
  }

  resume() {
    this.mediaRecorder?.resume();
    this.paused.set(false);
    const offset = this.tickMs();
    const newStart = Date.now() - offset;
    this.startedAt.set(newStart);
    this.tickInterval = setInterval(() => this.tickMs.set(Date.now() - this.startedAt()), 200);
  }

  stop() {
    this.mediaRecorder?.stop();
    this.recording.set(false);
    this.paused.set(false);
    clearInterval(this.tickInterval);
    this.stream?.getTracks().forEach(t => t.stop());
    this.micStream?.getTracks().forEach(t => t.stop());
    this.stream = undefined;
    this.micStream = undefined;
  }

  private finalize(mime: string) {
    if (!this.chunks.length) return;
    if (this.videoUrl()) URL.revokeObjectURL(this.videoUrl()!);
    const blob = new Blob(this.chunks, { type: mime });
    this.sizeBytes.set(blob.size);
    this.videoUrl.set(URL.createObjectURL(blob));
    this.chunks = [];
    this.toast.success('Recording ready');
  }

  download() {
    if (!this.videoUrl()) return;
    fetch(this.videoUrl()!).then(r => r.blob()).then(b => {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      saveAs(b, `recording-${stamp}.webm`);
    });
  }

  discard() {
    if (this.videoUrl()) URL.revokeObjectURL(this.videoUrl()!);
    this.videoUrl.set(null);
    this.sizeBytes.set(0);
  }

  ngOnDestroy() {
    this.stop();
    if (this.videoUrl()) URL.revokeObjectURL(this.videoUrl()!);
  }
}
