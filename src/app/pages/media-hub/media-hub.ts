import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

const MEDIA_TOOLS = [
  { id: 'video-gif', name: 'Video to GIF', desc: 'Convert short clips to animated GIFs.', icon: '🎬', route: '/media/video-to-gif', color: 'from-pink-500 to-rose-600' },
  { id: 'video-compress', name: 'Video Compressor', desc: 'Re-encode video at lower bitrate.', icon: '🎞', route: '/media/video-compress', color: 'from-emerald-500 to-teal-600' },
  { id: 'video-trim', name: 'Video Trimmer', desc: 'Cut a clip without re-encoding.', icon: '✂', route: '/media/video-trim', color: 'from-orange-500 to-amber-600' },
  { id: 'audio-convert', name: 'Audio Converter', desc: 'MP3, WAV, OGG, AAC, FLAC, M4A.', icon: '🎵', route: '/media/audio-convert', color: 'from-violet-500 to-fuchsia-600' },
  { id: 'audio-trim', name: 'Audio Trimmer', desc: 'Cut a section from an audio file.', icon: '✂', route: '/media/audio-trim', color: 'from-cyan-500 to-blue-600' },
];

@Component({
  selector: 'app-media-hub',
  imports: [RouterLink],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div class="mb-10">
        <span class="chip bg-pink-100 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300">Media Toolkit</span>
        <h1 class="mt-3 text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">Audio & Video tools</h1>
        <p class="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">FFmpeg.wasm running entirely in your browser. First use downloads ~30 MB of WASM core.</p>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (t of tools; track t.id) {
          <a [routerLink]="t.route" class="group card p-6 hover:-translate-y-1 hover:shadow-glow transition-all duration-300">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br {{ t.color }} grid place-items-center text-white text-xl font-bold shadow-lg">{{ t.icon }}</div>
            <h3 class="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{{ t.name }}</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t.desc }}</p>
          </a>
        }
      </div>
    </section>
  `,
})
export class MediaHub {
  protected tools = MEDIA_TOOLS;
}
