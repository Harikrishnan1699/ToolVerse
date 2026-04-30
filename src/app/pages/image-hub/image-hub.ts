import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

const IMAGE_TOOLS = [
  { id: 'compress', name: 'Image Compressor', desc: 'Shrink JPG / PNG / WebP with quality control.', icon: '🗜', route: '/image/compress', color: 'from-emerald-500 to-teal-600' },
  { id: 'resize', name: 'Image Resizer', desc: 'Resize to any dimension, keep aspect ratio.', icon: '⤢', route: '/image/resize', color: 'from-sky-500 to-blue-600' },
  { id: 'convert', name: 'Format Converter', desc: 'JPG ↔ PNG ↔ WebP ↔ BMP.', icon: '↔', route: '/image/convert', color: 'from-fuchsia-500 to-purple-600' },
  { id: 'watermark', name: 'Watermark', desc: 'Stamp text on photos, full styling.', icon: 'W', route: '/image/watermark', color: 'from-pink-500 to-fuchsia-600' },
  { id: 'favicon', name: 'Favicon Generator', desc: 'Every favicon size from one image.', icon: '✨', route: '/image/favicon', color: 'from-orange-500 to-amber-600' },
  { id: 'color-picker', name: 'Color Picker', desc: 'Pick colors and extract a palette.', icon: '🎨', route: '/image/color-picker', color: 'from-rose-500 to-pink-600' },
  { id: 'meme', name: 'Meme Generator', desc: 'Top + bottom captions, classic style.', icon: '😂', route: '/image/meme', color: 'from-yellow-500 to-orange-600' },
  { id: 'ocr', name: 'Image to Text (OCR)', desc: 'Extract text from images, 100+ languages.', icon: 'A', route: '/image/ocr', color: 'from-indigo-500 to-purple-600' },
  { id: 'bg-remove', name: 'Background Remover', desc: 'AI-powered, runs on-device.', icon: '✂', route: '/image/background-remove', color: 'from-rose-500 to-pink-600' },
];

@Component({
  selector: 'app-image-hub',
  imports: [RouterLink],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div class="mb-10">
        <span class="chip bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">Image Toolkit</span>
        <h1 class="mt-3 text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">Image tools</h1>
        <p class="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">{{ tools.length }} canvas + AI-powered tools — entirely in your browser.</p>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        @for (t of tools; track t.id) {
          <a [routerLink]="t.route" class="group card p-6 hover:-translate-y-1 hover:shadow-glow transition-all duration-300">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br {{ t.color }} grid place-items-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition">{{ t.icon }}</div>
            <h3 class="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{{ t.name }}</h3>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ t.desc }}</p>
          </a>
        }
      </div>
    </section>
  `,
})
export class ImageHub {
  protected tools = IMAGE_TOOLS;
}
