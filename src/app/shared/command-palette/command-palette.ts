import { Component, ElementRef, ViewChild, computed, inject, signal, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TOOLS } from '../tools';

interface Command { id: string; title: string; subtitle: string; icon: string; color: string; route: string; }

@Component({
  selector: 'app-command-palette',
  imports: [FormsModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-[55] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4" (click)="close()">
        <div class="card w-full max-w-2xl shadow-glow" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800">
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input #input
              class="flex-1 bg-transparent border-0 outline-none py-4 text-lg placeholder-slate-400"
              placeholder="Search 60+ tools…"
              [(ngModel)]="query" (ngModelChange)="reset()"
              (keydown)="onKey($event)" />
            <kbd class="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">ESC</kbd>
          </div>
          <ul class="max-h-96 overflow-y-auto p-2" #list>
            @for (c of filtered(); track c.id; let i = $index) {
              <li>
                <button
                  class="w-full flex items-center gap-3 p-2.5 rounded-lg text-left"
                  [class.bg-brand-50]="active() === i"
                  [class.dark:bg-brand-950]="active() === i"
                  (mouseenter)="active.set(i)"
                  (click)="go(c)">
                  <div class="w-9 h-9 rounded-lg bg-gradient-to-br {{ c.color }} grid place-items-center text-white text-sm font-bold">{{ c.icon }}</div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium truncate">{{ c.title }}</div>
                    <div class="text-xs text-slate-500 truncate">{{ c.subtitle }}</div>
                  </div>
                </button>
              </li>
            }
            @if (!filtered().length) {
              <li class="p-8 text-center text-sm text-slate-500">No tools match "{{ query }}"</li>
            }
          </ul>
          <div class="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-500">
            <div class="flex gap-3">
              <span><kbd class="font-mono">↑↓</kbd> navigate</span>
              <span><kbd class="font-mono">↵</kbd> open</span>
              <span><kbd class="font-mono">esc</kbd> close</span>
            </div>
            <span>{{ filtered().length }} of {{ commands.length }}</span>
          </div>
        </div>
      </div>
    }
  `,
})
export class CommandPalette implements AfterViewInit {
  @ViewChild('input') inputRef?: ElementRef<HTMLInputElement>;
  private router = inject(Router);
  protected open = signal(false);
  protected query = '';
  protected active = signal(0);

  protected commands: Command[] = [
    ...TOOLS.map(t => ({ id: t.id, title: t.name, subtitle: t.desc, icon: t.icon, color: t.color, route: t.route })),
    { id: 'home', title: 'Home', subtitle: 'Toolverse landing', icon: '🏠', color: 'from-brand-500 to-indigo-600', route: '/' },
    { id: 'pdf-hub', title: 'PDF tools hub', subtitle: 'All PDF tools', icon: '📄', color: 'from-orange-500 to-rose-500', route: '/pdf' },
    { id: 'image-hub', title: 'Image tools hub', subtitle: 'All image tools', icon: '🖼', color: 'from-purple-500 to-fuchsia-600', route: '/image' },
    { id: 'media-hub', title: 'Media tools hub', subtitle: 'Video & audio', icon: '🎬', color: 'from-pink-500 to-rose-600', route: '/media' },
    { id: 'dev-hub', title: 'Developer tools hub', subtitle: 'JSON, base64, hash, etc', icon: '⌨', color: 'from-emerald-500 to-teal-600', route: '/dev' },
    { id: 'text-hub', title: 'Text tools hub', subtitle: 'Counter, case, lorem, etc', icon: '¶', color: 'from-indigo-500 to-violet-600', route: '/text' },
    { id: 'calc-hub', title: 'Calculators', subtitle: 'Unit, BMI, loan, GST', icon: '∑', color: 'from-emerald-500 to-green-600', route: '/calc' },
    { id: 'settings', title: 'Settings', subtitle: 'Storage, theme, preferences', icon: '⚙', color: 'from-slate-500 to-slate-700', route: '/settings' },
  ];

  protected filtered = computed(() => {
    const q = this.query.toLowerCase().trim();
    if (!q) return this.commands;
    return this.commands.filter(c => c.title.toLowerCase().includes(q) || c.subtitle.toLowerCase().includes(q) || c.id.includes(q));
  });

  ngAfterViewInit() {}

  show() { this.open.set(true); this.query = ''; this.active.set(0); setTimeout(() => this.inputRef?.nativeElement.focus(), 0); }
  close() { this.open.set(false); }
  reset() { this.active.set(0); }

  onKey(e: KeyboardEvent) {
    const list = this.filtered();
    if (e.key === 'ArrowDown') { e.preventDefault(); this.active.set(Math.min(list.length - 1, this.active() + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active.set(Math.max(0, this.active() - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); const c = list[this.active()]; if (c) this.go(c); }
    else if (e.key === 'Escape') { this.close(); }
  }

  go(c: Command) { this.router.navigateByUrl(c.route); this.close(); }
}
