import { Component, ElementRef, ViewChild, signal, OnDestroy } from '@angular/core';
import jsQR from 'jsqr';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-qr-scanner',
  imports: [Dropzone, SectionHeader],
  template: `
    <app-section-header title="QR Code Scanner" subtitle="Scan a QR using your camera or upload an image of one." icon="◳" color="from-cyan-500 to-blue-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-2 flex gap-1">
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="mode() === 'cam'" (click)="setMode('cam')">📷 Camera</button>
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="mode() === 'img'" (click)="setMode('img')">🖼 Image</button>
      </div>

      @if (mode() === 'cam') {
        <div class="card p-4 space-y-3">
          @if (!streaming()) {
            <button class="btn-primary w-full" (click)="start()">Start camera</button>
          } @else {
            <video #vid class="w-full rounded-xl bg-black aspect-video" autoplay playsinline muted></video>
            <button class="btn-secondary w-full" (click)="stop()">Stop</button>
          }
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>
      } @else {
        <app-dropzone title="Drop an image with a QR" accept="image/*" (files)="scanFile($event)" />
      }

      @if (result()) {
        <div class="card p-6 space-y-3">
          <div class="text-xs font-semibold text-emerald-600 uppercase">✓ Scanned</div>
          <div class="font-mono text-sm break-all bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3">{{ result() }}</div>
          @if (isUrl()) { <a [href]="result()" target="_blank" class="btn-primary w-full">Open link →</a> }
          <button class="btn-secondary w-full" (click)="copy()">Copy</button>
        </div>
      }
    </section>
  `,
})
export class QrScanner implements OnDestroy {
  @ViewChild('vid') vidRef?: ElementRef<HTMLVideoElement>;
  protected mode = signal<'cam' | 'img'>('cam');
  protected streaming = signal(false);
  protected result = signal('');
  protected error = signal('');
  private stream?: MediaStream;
  private rafId = 0;

  setMode(m: 'cam' | 'img') { this.stop(); this.mode.set(m); this.result.set(''); }

  isUrl() { return /^https?:\/\//.test(this.result()); }

  async start() {
    this.error.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.streaming.set(true);
      setTimeout(() => {
        if (this.vidRef?.nativeElement && this.stream) {
          this.vidRef.nativeElement.srcObject = this.stream;
          this.scanLoop();
        }
      }, 0);
    } catch { this.error.set('Camera access denied.'); }
  }

  stop() {
    cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach(t => t.stop());
    this.streaming.set(false); this.stream = undefined;
  }

  ngOnDestroy() { this.stop(); }

  private scanLoop = () => {
    const v = this.vidRef?.nativeElement;
    if (!v || !this.streaming()) return;
    if (v.readyState === v.HAVE_ENOUGH_DATA) {
      const c = document.createElement('canvas');
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext('2d')!; ctx.drawImage(v, 0, 0);
      const img = ctx.getImageData(0, 0, c.width, c.height);
      const code = jsQR(img.data, img.width, img.height);
      if (code) { this.result.set(code.data); this.stop(); return; }
    }
    this.rafId = requestAnimationFrame(this.scanLoop);
  };

  async scanFile(list: File[]) {
    const f = list[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image(); img.src = url;
    await new Promise(r => img.onload = r);
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height);
    const code = jsQR(data.data, data.width, data.height);
    URL.revokeObjectURL(url);
    if (code) this.result.set(code.data);
    else this.error.set('No QR code found in that image.');
  }

  async copy() { try { await navigator.clipboard.writeText(this.result()); } catch {} }
}
