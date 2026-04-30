import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-section-header',
  imports: [RouterLink],
  template: `
    <div class="relative overflow-hidden">
      <div class="absolute inset-0 mesh-bg opacity-60"></div>
      <div class="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        @if (back) {
          <a [routerLink]="back" class="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            {{ backLabel }}
          </a>
        }
        <div class="flex items-start gap-4">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br {{ color }} grid place-items-center text-white text-2xl font-bold shadow-glow">{{ icon }}</div>
          <div>
            <h1 class="text-3xl lg:text-4xl font-display font-bold text-slate-900 dark:text-white">{{ title }}</h1>
            <p class="mt-1 text-slate-600 dark:text-slate-400">{{ subtitle }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SectionHeader {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() color = 'from-brand-500 to-indigo-600';
  @Input() back = '';
  @Input() backLabel = 'Back';
}
