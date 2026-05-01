import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BroadcastService } from './broadcast.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private broadcast = inject(BroadcastService);
  readonly isDark = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.isDark.set(document.documentElement.classList.contains('dark'));
    }
  }

  toggle() {
    if (!isPlatformBrowser(this.platformId)) return;
    const next = !this.isDark();
    this.isDark.set(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    this.broadcast.send('theme', next);
  }
}
