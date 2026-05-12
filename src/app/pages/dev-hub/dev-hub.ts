import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

const DEV_TOOLS = [
  { id: 'json', name: 'JSON Formatter', desc: 'Beautify, minify, validate JSON.', icon: '{}', route: '/dev/json', color: 'from-emerald-500 to-teal-600' },
  { id: 'base64', name: 'Base64', desc: 'Encode / decode text or files.', icon: '64', route: '/dev/base64', color: 'from-sky-500 to-cyan-600' },
  { id: 'url', name: 'URL Encoder', desc: 'Encode / decode URL-safe strings.', icon: '%', route: '/dev/url', color: 'from-blue-500 to-indigo-600' },
  { id: 'hash', name: 'Hash Generator', desc: 'MD5, SHA-1/256/512/3.', icon: '#', route: '/dev/hash', color: 'from-purple-500 to-violet-600' },
  { id: 'jwt', name: 'JWT Decoder', desc: 'Decode header, payload, expiry.', icon: 'JWT', route: '/dev/jwt', color: 'from-rose-500 to-fuchsia-600' },
  { id: 'uuid', name: 'UUID Generator', desc: 'Random UUID v4 / GUID.', icon: 'ID', route: '/dev/uuid', color: 'from-amber-500 to-orange-600' },
  { id: 'regex', name: 'Regex Tester', desc: 'Live-test JS regular expressions.', icon: '.*', route: '/dev/regex', color: 'from-pink-500 to-rose-600' },
  { id: 'color', name: 'Color Converter', desc: 'HEX ↔ RGB ↔ HSL.', icon: '●', route: '/dev/color', color: 'from-fuchsia-500 to-pink-600' },
  { id: 'gradient', name: 'Gradient Generator', desc: 'Linear / radial CSS gradients.', icon: '◐', route: '/dev/gradient', color: 'from-fuchsia-500 to-purple-600' },
  { id: 'shadow', name: 'Box-Shadow', desc: 'Visual CSS box-shadow builder.', icon: '▣', route: '/dev/box-shadow', color: 'from-slate-500 to-slate-700' },
  { id: 'html', name: 'HTML Formatter', desc: 'Beautify, minify and preview HTML.', icon: '</>', route: '/dev/html', color: 'from-orange-500 to-rose-500' },
];

@Component({
  selector: 'app-dev-hub',
  imports: [RouterLink],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div class="mb-10">
        <span class="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Developer Toolkit</span>
        <h1 class="mt-3 text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">Developer tools</h1>
        <p class="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">{{ tools.length }} micro-utilities every developer reaches for.</p>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
export class DevHub {
  protected tools = DEV_TOOLS;
}
