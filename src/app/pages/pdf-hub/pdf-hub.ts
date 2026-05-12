import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PDF_TOOLS, PDF_GROUPS, Tool } from '../../shared/tools';

const GROUP_META: Record<string, { gradient: string; accent: string; emoji: string; tagline: string }> = {
  organize:        { gradient: 'from-violet-500 to-purple-600', accent: 'text-violet-600 dark:text-violet-300', emoji: '🗂', tagline: 'Reorder, split, merge — bring order to your pages.' },
  optimize:        { gradient: 'from-emerald-500 to-teal-500', accent: 'text-emerald-600 dark:text-emerald-300', emoji: '⚡', tagline: 'Shrink and repair files — keep the quality.' },
  'convert-to':    { gradient: 'from-amber-500 to-orange-500', accent: 'text-amber-600 dark:text-amber-300', emoji: '📥', tagline: 'Turn images & HTML into clean PDFs.' },
  'convert-from':  { gradient: 'from-yellow-500 to-orange-500', accent: 'text-yellow-600 dark:text-yellow-300', emoji: '📤', tagline: 'Export your PDF as JPG / PNG pages.' },
  edit:            { gradient: 'from-sky-500 to-indigo-500', accent: 'text-sky-600 dark:text-sky-300', emoji: '✎', tagline: 'Annotate, watermark, rotate, crop, number.' },
  security:        { gradient: 'from-rose-500 to-pink-600', accent: 'text-rose-600 dark:text-rose-300', emoji: '🛡', tagline: 'Protect, sign, redact and unlock.' },
};

@Component({
  selector: 'app-pdf-hub',
  imports: [RouterLink, FormsModule],
  template: `
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 mesh-bg opacity-70"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16 pb-8">
        <span class="chip bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">PDF Toolkit</span>
        <h1 class="mt-3 text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">
          Every PDF tool you need <span class="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">in your browser</span>
        </h1>
        <p class="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">
          {{ tools.length }} tools across {{ groups.length }} categories — all running entirely on-device. Files never leave your browser.
        </p>

        <div class="mt-6 flex flex-wrap gap-3 items-center">
          <div class="relative flex-1 min-w-[260px] max-w-md">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
            <input class="input !pl-9" placeholder="Search tools — merge, compress, watermark…" [(ngModel)]="query" />
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                    [class.bg-brand-500]="!filter()" [class.text-white]="!filter()"
                    [class.bg-slate-100]="filter()" [class.dark:bg-slate-800]="filter()"
                    (click)="filter.set(null)">All</button>
            @for (g of groups; track g.id) {
              <button class="px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      [class.bg-brand-500]="filter() === g.id" [class.text-white]="filter() === g.id"
                      [class.bg-slate-100]="filter() !== g.id" [class.dark:bg-slate-800]="filter() !== g.id"
                      (click)="filter.set(g.id)">{{ groupMeta[g.id].emoji }} {{ g.label }}</button>
            }
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-2">

      @if (visibleGroups().length === 0) {
        <div class="card p-10 text-center text-slate-500">
          No tools match <span class="font-mono">"{{ query }}"</span>.
        </div>
      }

      @for (g of visibleGroups(); track g.id) {
        <div class="mb-12">
          <div class="flex items-end justify-between mb-4 gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br {{ groupMeta[g.id].gradient }} grid place-items-center text-white text-lg shadow-md">
                {{ groupMeta[g.id].emoji }}
              </div>
              <div>
                <div class="text-xs font-bold tracking-widest uppercase {{ groupMeta[g.id].accent }}">{{ g.label }}</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">{{ groupMeta[g.id].tagline }}</div>
              </div>
            </div>
            <div class="text-xs text-slate-400">{{ filteredByGroup(g.id).length }} tools</div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
            @for (t of filteredByGroup(g.id); track t.id) {
              <a [routerLink]="t.route" class="group relative card p-4 hover:-translate-y-1 hover:shadow-glow transition-all duration-300 overflow-hidden">
                <div class="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition bg-gradient-to-br {{ t.color }} blur-2xl"></div>
                <div class="relative">
                  <div class="w-11 h-11 rounded-xl bg-gradient-to-br {{ t.color }} grid place-items-center text-white text-lg font-bold shadow-lg group-hover:scale-110 group-hover:rotate-3 transition">
                    {{ t.icon }}
                  </div>
                  <h3 class="mt-3 font-semibold text-sm text-slate-900 dark:text-white leading-tight">{{ t.name }}</h3>
                  <p class="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">{{ t.desc }}</p>
                </div>
              </a>
            }
          </div>
        </div>
      }

      <div class="card p-6 mt-8 bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 border-sky-100 dark:border-sky-900/40">
        <div class="flex flex-wrap items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center text-white text-xl shadow-md">🛡</div>
          <div class="flex-1 min-w-[240px]">
            <div class="font-display font-bold text-lg text-slate-900 dark:text-white">100% client-side</div>
            <div class="text-sm text-slate-600 dark:text-slate-400">Files never leave your device. No uploads, no tracking, no accounts. Tip: copy an image and press <kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Ctrl</kbd>+<kbd class="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">V</kbd> to paste it straight into any upload area.</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <span class="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">No uploads</span>
            <span class="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">Works offline</span>
            <span class="chip bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">PWA installable</span>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class PdfHub {
  protected tools = PDF_TOOLS;
  protected groups = PDF_GROUPS;
  protected groupMeta = GROUP_META;
  protected query = '';
  protected filter = signal<string | null>(null);

  protected visibleGroups = computed(() => {
    const f = this.filter();
    const allowed = f ? this.groups.filter(g => g.id === f) : this.groups;
    return allowed.filter(g => this.filteredByGroup(g.id).length > 0);
  });

  filteredByGroup(id: string): Tool[] {
    const q = this.query.trim().toLowerCase();
    return PDF_TOOLS.filter(t =>
      t.group === id &&
      (!q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q))
    );
  }
}
