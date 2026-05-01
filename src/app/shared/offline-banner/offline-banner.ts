import { Component, inject } from '@angular/core';
import { NetworkService } from '../network.service';

@Component({
  selector: 'app-offline-banner',
  template: `
    @if (!net.online()) {
      <div class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-glow flex items-center gap-2">
        📶 Offline — most tools still work locally
      </div>
    }
  `,
})
export class OfflineBanner {
  protected net = inject(NetworkService);
}
