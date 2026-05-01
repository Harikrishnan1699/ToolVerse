import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class LaunchService {
  private router = inject(Router);

  init(): void {
    // 1. File handler — when OS launches us with files
    if ('launchQueue' in window) {
      try {
        (window as any).launchQueue.setConsumer(async (params: any) => {
          if (!params?.files?.length) return;
          try {
            const files: File[] = await Promise.all(params.files.map((h: any) => h.getFile()));
            (window as any).__tvLaunchFiles = files;
            this.router.navigateByUrl('/open');
          } catch {}
        });
      } catch {}
    }

    // 2. Protocol handler — web+toolverse://...
    try {
      const url = new URL(window.location.href);
      const proto = url.searchParams.get('proto');
      if (proto) {
        // proto looks like "web+toolverse://json?data=foo"
        const m = proto.match(/^web\+toolverse:\/?\/?([^?]+)(?:\?(.+))?$/);
        if (m) {
          const tool = m[1].replace(/^\/+|\/+$/g, '');
          const query = m[2] ?? '';
          const map: Record<string, string> = {
            json: '/dev/json', qr: '/qr/generator', merge: '/pdf/merge',
            compress: '/pdf/compress', currency: '/currency', crypto: '/crypto', weather: '/weather',
          };
          const target = map[tool] ?? '/' + tool;
          this.router.navigateByUrl(target + (query ? '?' + query : ''));
        }
      }
    } catch {}
  }
}
