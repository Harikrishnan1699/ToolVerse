import { Component, OnInit, inject, signal } from '@angular/core';
import { StorageManagerService } from '../../shared/storage-manager.service';
import { ThemeService } from '../../shared/theme.service';
import { RecentService } from '../../shared/recent.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-settings',
  template: `
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div>
        <h1 class="text-3xl font-display font-bold">Settings</h1>
        <p class="text-slate-500 mt-1">All settings live on your device. Toolverse never sends them anywhere.</p>
      </div>

      <div class="card p-6 space-y-3">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">Theme</div>
            <div class="text-sm text-slate-500">Light or dark mode</div>
          </div>
          <button class="btn-secondary" (click)="theme.toggle()">
            {{ theme.isDark() ? '🌙 Dark' : '☀️ Light' }}
          </button>
        </div>
      </div>

      <div class="card p-6 space-y-4">
        <div>
          <div class="font-semibold">Storage</div>
          <div class="text-sm text-slate-500">{{ store.fmt(store.usageBytes()) }} of {{ store.fmt(store.quotaBytes()) }} used</div>
        </div>
        <div class="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div class="h-full bg-gradient-to-r from-brand-500 to-fuchsia-500" [style.width.%]="pct()"></div>
        </div>
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="text-sm">
            Persistent storage: <strong>{{ store.persisted() ? 'Enabled' : 'Not requested' }}</strong>
          </div>
          @if (!store.persisted()) {
            <button class="btn-primary" (click)="askPersist()">Make persistent</button>
          }
        </div>
        <div class="text-xs text-slate-500">Persistent storage prevents the browser from evicting Toolverse data when storage is low.</div>
      </div>

      <div class="card p-6 space-y-3">
        <div class="font-semibold">Recent tools</div>
        <div class="text-sm text-slate-500">{{ recent.recent().length }} tools tracked</div>
        <button class="btn-secondary text-xs" (click)="clearRecent()">Clear recent</button>
      </div>

      <div class="card p-6 space-y-3">
        <div class="font-semibold">Local data</div>
        <div class="text-sm text-slate-500">Wipe everything Toolverse has stored on this device.</div>
        <button class="btn-secondary text-xs text-rose-600" (click)="wipe()">Erase all local data</button>
      </div>
    </section>
  `,
})
export class Settings implements OnInit {
  protected store = inject(StorageManagerService);
  protected theme = inject(ThemeService);
  protected recent = inject(RecentService);
  protected toast = inject(ToastService);

  protected pct = signal(0);

  async ngOnInit() {
    await this.store.refresh();
    const q = this.store.quotaBytes();
    this.pct.set(q ? Math.min(100, (this.store.usageBytes() / q) * 100) : 0);
  }

  async askPersist() {
    const ok = await this.store.requestPersistent();
    if (ok) this.toast.success('Storage is now persistent.');
    else this.toast.warn('Browser declined the persistent-storage request.');
  }

  clearRecent() { this.recent.clear(); this.toast.success('Recent tools cleared.'); }

  async wipe() {
    if (!confirm('Erase all local Toolverse data (todos, notes, recent, theme)?')) return;
    try {
      localStorage.clear();
      const dbs = await (indexedDB as any).databases?.() ?? [];
      for (const d of dbs) if (d.name) indexedDB.deleteDatabase(d.name);
      this.toast.success('Wiped — reload to start fresh.');
    } catch { this.toast.error('Could not erase all data.'); }
  }
}
