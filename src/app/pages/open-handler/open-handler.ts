import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-open-handler',
  template: `
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div class="card p-10">
        <div class="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white text-4xl shadow-glow">📂</div>
        <h1 class="mt-6 text-2xl font-display font-bold">{{ status() }}</h1>
        <p class="mt-2 text-slate-500">{{ detail() }}</p>
        @if (error()) { <a routerLink="/" class="btn-secondary mt-6">Back to home</a> }
      </div>
    </section>
  `,
})
export class OpenHandler implements OnInit {
  private router = inject(Router);
  protected status = signal('Reading file…');
  protected detail = signal('');
  protected error = signal(false);

  async ngOnInit() {
    const files = (window as any).__tvLaunchFiles as File[] | undefined;
    if (!files?.length) {
      this.status.set('No file was provided');
      this.detail.set('Try opening this app via "Open with" on a supported file.');
      this.error.set(true);
      return;
    }
    const f = files[0];
    (window as any).__tvIncomingFiles = files;
    this.status.set('Opening "' + f.name + '"…');
    const t = f.type;
    let route = '/';
    if (t.startsWith('application/pdf')) route = files.length > 1 ? '/pdf/merge' : '/pdf/compress';
    else if (t.startsWith('image/')) route = files.length > 1 ? '/pdf/images-to-pdf' : '/image/compress';
    else if (t.startsWith('audio/')) route = '/media/audio-convert';
    else if (t.startsWith('video/')) route = '/media/video-compress';
    else if (t === 'application/json') route = '/dev/json';
    else if (t === 'text/csv') route = '/dev/json';
    else if (t.startsWith('text/')) route = '/text';
    await this.router.navigateByUrl(route);
  }
}
