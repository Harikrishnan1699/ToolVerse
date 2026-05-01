import { Component, ViewChild, signal, inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { Navbar } from './shared/navbar/navbar';
import { Footer } from './shared/footer/footer';
import { Breadcrumb } from './shared/breadcrumb/breadcrumb';
import { LaunchService } from './shared/launch.service';
import { UpdateService } from './shared/update.service';
import { NetworkService } from './shared/network.service';
import { BatteryService } from './shared/battery.service';
import { BroadcastService } from './shared/broadcast.service';
import { StorageManagerService } from './shared/storage-manager.service';
import { KeyboardService } from './shared/keyboard.service';
import { RecentService } from './shared/recent.service';
import { ToastHost } from './shared/toast-host/toast-host';
import { CommandPalette } from './shared/command-palette/command-palette';
import { ShortcutsHelp } from './shared/shortcuts-help/shortcuts-help';
import { OfflineBanner } from './shared/offline-banner/offline-banner';
import { DragOverlay } from './shared/drag-overlay/drag-overlay';
import { TOOLS } from './shared/tools';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Breadcrumb, ToastHost, CommandPalette, ShortcutsHelp, OfflineBanner, DragOverlay],
  template: `
    <div class="min-h-screen flex flex-col" [class.focus-mode]="focusMode()">
      <app-navbar />
      <app-breadcrumb />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-footer />
    </div>
    <app-toast-host />
    <app-command-palette #palette />
    <app-shortcuts-help />
    <app-offline-banner />
    <app-drag-overlay />
  `,
  styles: [`
    :host ::ng-deep .focus-mode app-navbar,
    :host ::ng-deep .focus-mode app-breadcrumb,
    :host ::ng-deep .focus-mode app-footer { display: none; }
  `],
})
export class App implements AfterViewInit {
  protected readonly title = signal('toolverse');
  protected readonly focusMode = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly launch = inject(LaunchService);
  private readonly update = inject(UpdateService);
  private readonly network = inject(NetworkService);
  private readonly battery = inject(BatteryService);
  private readonly broadcast = inject(BroadcastService);
  private readonly storage = inject(StorageManagerService);
  private readonly kb = inject(KeyboardService);
  private readonly recent = inject(RecentService);
  private readonly router = inject(Router);

  @ViewChild('palette') palette?: CommandPalette;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
      this.launch.init();
      this.update.init();
      this.network.init();
      this.battery.init();
      this.broadcast.init();
      this.storage.init();
      this.kb.init();
      this.recent.init();

      this.broadcast.on('theme', (dark: boolean) => {
        document.documentElement.classList.toggle('dark', dark);
      });

      this.router.events.pipe(filter((e: any) => e instanceof NavigationEnd)).subscribe((e: NavigationEnd) => {
        const url = e.urlAfterRedirects.split('?')[0];
        const tool = TOOLS.find(t => t.route === url);
        if (tool) this.recent.push({ route: tool.route, title: tool.name, icon: tool.icon, color: tool.color });
      });
    }
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.kb.register({ keys: 'ctrl+k', description: 'Open command palette', run: () => this.palette?.show() });
    this.kb.register({ keys: 'ctrl+/', description: 'Open command palette', run: () => this.palette?.show() });
    this.kb.register({ keys: 'ctrl+,', description: 'Open settings', run: () => this.router.navigateByUrl('/settings') });
    this.kb.register({ keys: 'ctrl+shift+f', description: 'Toggle focus mode', run: () => this.focusMode.update(v => !v) });
    this.kb.register({ keys: 'ctrl+shift+l', description: 'Toggle theme', run: () => this.toggleTheme() });
  }

  private toggleTheme() {
    const isDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.broadcast.send('theme', isDark);
  }
}
