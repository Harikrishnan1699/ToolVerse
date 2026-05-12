import { Component, ElementRef, ViewChild, signal, OnDestroy } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-scan',
  imports: [PageHeader],
  template: `
    <app-page-header title="Scan to PDF" subtitle="Capture pages with your camera and turn them into a multi-page PDF." icon="📷" color="from-rose-500 to-orange-500" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="grid lg:grid-cols-2 gap-6" data-no-drop>
        <div class="card p-6 space-y-4">
          <div class="rounded-2xl overflow-hidden bg-black aspect-[3/4] grid place-items-center">
            @if (streaming()) {
              <video #vid class="w-full h-full object-cover" autoplay playsinline muted></video>
            } @else {
              <div class="text-center text-white/70 p-6">
                <div class="text-5xl">📷</div>
                <div class="mt-2 text-sm">Camera preview will appear here</div>
              </div>
            }
          </div>
          <div class="flex gap-2">
            @if (!streaming()) {
              <button class="btn-primary flex-1" (click)="start()">Start camera</button>
            } @else {
              <button class="btn-primary flex-1" (click)="snap()">📸 Capture page</button>
              <button class="btn-secondary" (click)="stop()">Stop</button>
            }
          </div>
          @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold">Captured pages ({{ shots().length }})</h3>
            @if (shots().length) {
              <div class="flex gap-2">
                <button class="btn-ghost px-3 py-1.5 text-xs" (click)="clear()">Clear</button>
                <button class="btn-primary px-3 py-1.5 text-xs" (click)="build()" [disabled]="busy()">
                  @if (busy()) { Building… } @else { Build PDF }
                </button>
              </div>
            }
          </div>
          @if (!shots().length) {
            <p class="text-sm text-slate-500">No pages captured yet. Start the camera and snap pages — each capture becomes one page.</p>
          } @else {
            <div class="grid grid-cols-2 gap-3">
              @for (s of shots(); track s.url; let i = $index) {
                <div class="relative group">
                  <img [src]="s.url" class="w-full rounded-xl border border-slate-200 dark:border-slate-700" />
                  <button class="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 text-white text-xs opacity-0 group-hover:opacity-100" (click)="del(i)">×</button>
                  <div class="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">{{ i + 1 }}</div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class PdfScan implements OnDestroy {
  @ViewChild('vid') vidRef?: ElementRef<HTMLVideoElement>;
  protected streaming = signal(false);
  protected error = signal('');
  protected busy = signal(false);
  protected shots = signal<{ url: string; blob: Blob }[]>([]);
  private stream?: MediaStream;

  async start() {
    this.error.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      this.streaming.set(true);
      setTimeout(() => {
        if (this.vidRef?.nativeElement && this.stream) this.vidRef.nativeElement.srcObject = this.stream;
      }, 0);
    } catch {
      this.error.set('Camera access was denied or unavailable.');
    }
  }

  stop() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.streaming.set(false);
    this.stream = undefined;
  }

  ngOnDestroy() { this.stop(); this.shots().forEach(s => URL.revokeObjectURL(s.url)); }

  async snap() {
    const v = this.vidRef?.nativeElement; if (!v) return;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    const blob: Blob = await new Promise(res => c.toBlob(b => res(b!), 'image/jpeg', 0.9));
    this.shots.update(s => [...s, { url: URL.createObjectURL(blob), blob }]);
  }

  del(i: number) {
    URL.revokeObjectURL(this.shots()[i].url);
    this.shots.update(s => s.filter((_, idx) => idx !== i));
  }
  clear() { this.shots().forEach(s => URL.revokeObjectURL(s.url)); this.shots.set([]); }

  async build() {
    if (!this.shots().length) return;
    this.busy.set(true);
    try {
      const doc = await PDFDocument.create();
      for (const s of this.shots()) {
        const buf = await s.blob.arrayBuffer();
        const img = await doc.embedJpg(buf);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      }
      const data = await doc.save();
      saveAs(new Blob([data as BlobPart], { type: 'application/pdf' }), 'toolverse-scan.pdf');
    } finally { this.busy.set(false); }
  }
}
