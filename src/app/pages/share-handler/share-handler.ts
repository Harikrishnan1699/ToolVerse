import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SharedFilesService } from '../../shared/shared-files.service';

@Component({
  selector: 'app-share-handler',
  template: `
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div class="card p-10">
        <div class="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 grid place-items-center text-white text-4xl shadow-glow animate-float">📥</div>
        <h1 class="mt-6 text-2xl font-display font-bold">{{ status() }}</h1>
        <p class="mt-2 text-slate-500">{{ detail() }}</p>
        @if (error()) { <a routerLink="/" class="btn-secondary mt-6">Back to home</a> }
      </div>
    </section>
  `,
})
export class ShareHandler implements OnInit {
  private shared = inject(SharedFilesService);
  private router = inject(Router);
  protected status = signal('Receiving shared content…');
  protected detail = signal('');
  protected error = signal(false);

  async ngOnInit() {
    const payload = await this.shared.take();
    if (!payload || (!payload.files.length && !payload.text && !payload.url)) {
      this.status.set('Nothing to share');
      this.detail.set('No file or text was received.');
      this.error.set(true);
      return;
    }

    if (payload.files.length) {
      const f = payload.files[0];
      const t = f.type;
      this.status.set('Opening "' + f.name + '"…');
      const route = this.routeForType(t, payload.files.length);
      // stash files in window for the destination tool to pick up
      (window as any).__tvIncomingFiles = payload.files;
      await this.router.navigateByUrl(route);
      return;
    }

    if (payload.url || payload.text) {
      const text = (payload.url || payload.text).trim();
      this.status.set('Generating QR for shared text…');
      (window as any).__tvIncomingText = text;
      await this.router.navigateByUrl('/qr/generator?text=' + encodeURIComponent(text));
    }
  }

  private routeForType(type: string, count: number): string {
    if (type.startsWith('application/pdf')) return count > 1 ? '/pdf/merge' : '/pdf/compress';
    if (type.startsWith('image/')) return count > 1 ? '/pdf/images-to-pdf' : '/image/compress';
    if (type.startsWith('audio/')) return '/media/audio-convert';
    if (type.startsWith('video/')) return '/media/video-compress';
    if (type === 'application/json') return '/dev/json';
    return '/';
  }
}
