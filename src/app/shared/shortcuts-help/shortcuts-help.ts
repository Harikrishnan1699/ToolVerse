import { Component, inject } from '@angular/core';
import { KeyboardService } from '../keyboard.service';

@Component({
  selector: 'app-shortcuts-help',
  template: `
    @if (kb.cheatsheetOpen()) {
      <div class="fixed inset-0 z-[55] bg-slate-900/60 backdrop-blur-sm grid place-items-center px-4" (click)="kb.cheatsheetOpen.set(false)">
        <div class="card max-w-md w-full p-6" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-display font-bold text-lg">Keyboard shortcuts</h2>
            <button class="text-slate-400 hover:text-slate-700" (click)="kb.cheatsheetOpen.set(false)">×</button>
          </div>
          <div class="space-y-2">
            @for (s of kb.list(); track s.keys) {
              <div class="flex items-center justify-between gap-3 py-1">
                <div class="text-sm text-slate-700 dark:text-slate-200">{{ s.description }}</div>
                <kbd class="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">{{ s.keys }}</kbd>
              </div>
            }
            <div class="flex items-center justify-between py-1">
              <div class="text-sm">Show this help</div>
              <kbd class="font-mono text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800">?</kbd>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ShortcutsHelp {
  protected kb = inject(KeyboardService);
}
