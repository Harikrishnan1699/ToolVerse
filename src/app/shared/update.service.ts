import { Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private sw = inject(SwUpdate);
  private toast = inject(ToastService);

  init(): void {
    if (!this.sw.isEnabled) return;
    this.sw.versionUpdates.subscribe((evt: any) => {
      if (evt.type === 'VERSION_READY') {
        this.toast.info('A new version of Toolverse is available.', {
          ttl: 0,
          action: { label: 'Reload', run: async () => { await this.sw.activateUpdate(); location.reload(); } },
        });
      }
    });
    // Check for updates every 30 minutes while open
    setInterval(() => this.sw.checkForUpdate().catch(() => {}), 30 * 60 * 1000);
  }
}
