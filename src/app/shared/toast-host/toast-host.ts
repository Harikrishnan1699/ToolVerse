import { Component, inject } from '@angular/core';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-toast-host',
  template: `
    <div class="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm pointer-events-none">
      @for (t of toast.toasts(); track t.id) {
        <div class="pointer-events-auto card p-4 flex items-start gap-3 shadow-glow animate-fade-up"
             [class.border-emerald-300]="t.kind === 'success'"
             [class.border-rose-300]="t.kind === 'error'"
             [class.border-amber-300]="t.kind === 'warn'">
          <div class="text-xl">
            @switch (t.kind) {
              @case ('success') { ✅ }
              @case ('error') { ⚠️ }
              @case ('warn') { ⚠ }
              @default { ℹ️ }
            }
          </div>
          <div class="flex-1 text-sm">{{ t.message }}</div>
          @if (t.action) {
            <button class="btn-secondary text-xs" (click)="t.action!.run(); toast.dismiss(t.id)">{{ t.action.label }}</button>
          }
          <button class="text-slate-400 hover:text-slate-700" (click)="toast.dismiss(t.id)">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastHost {
  protected toast = inject(ToastService);
}
