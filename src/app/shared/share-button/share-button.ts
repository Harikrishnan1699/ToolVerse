import { Component, Input, inject } from '@angular/core';
import { WebShareService } from '../web-share.service';

@Component({
  selector: 'app-share-button',
  template: `
    @if (svc.supported) {
      <button class="btn-secondary text-xs" (click)="share()" [title]="title || 'Share'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12"/></svg>
        Share
      </button>
    }
  `,
})
export class ShareButton {
  protected svc = inject(WebShareService);
  @Input() file: File | null = null;
  @Input() text = '';
  @Input() url = '';
  @Input() title = '';

  async share() {
    if (this.file) await this.svc.shareFile(this.file);
    else await this.svc.share({ title: this.title, text: this.text, url: this.url });
  }
}
