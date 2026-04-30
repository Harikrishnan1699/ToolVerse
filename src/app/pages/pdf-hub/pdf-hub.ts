import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PDF_TOOLS, PDF_GROUPS, Tool } from '../../shared/tools';

@Component({
  selector: 'app-pdf-hub',
  imports: [RouterLink],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div class="mb-10">
        <span class="chip bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300">PDF Toolkit</span>
        <h1 class="mt-3 text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white">Every PDF tool you need</h1>
        <p class="mt-2 text-slate-600 dark:text-slate-400 max-w-2xl">{{ tools.length }} tools, all running entirely in your browser. Files never leave your device.</p>
      </div>

      @for (g of groups; track g.id) {
        <div class="mb-12">
          <div class="text-xs font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-4">{{ g.label }}</div>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            @for (t of byGroup(g.id); track t.id) {
              <a [routerLink]="t.route" class="group card p-5 hover:-translate-y-1 hover:shadow-glow transition-all duration-300">
                <div class="w-12 h-12 rounded-xl bg-gradient-to-br {{ t.color }} grid place-items-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition">
                  {{ t.icon }}
                </div>
                <h3 class="mt-4 font-semibold text-slate-900 dark:text-white">{{ t.name }}</h3>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{{ t.desc }}</p>
              </a>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class PdfHub {
  protected tools = PDF_TOOLS;
  protected groups = PDF_GROUPS;
  byGroup(id: string): Tool[] { return PDF_TOOLS.filter(t => t.group === id); }
}
