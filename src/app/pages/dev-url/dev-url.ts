import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-dev-url',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="URL Encoder / Decoder" subtitle="Encode strings for URLs or decode percent-encoded text." icon="%" color="from-blue-500 to-indigo-600" back="/dev" backLabel="All developer tools" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-2 gap-4">
      <div class="card p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plain</div>
          <button class="btn-ghost text-xs px-2 py-1" (click)="enc()">→ Encode</button>
        </div>
        <textarea class="input font-mono text-xs h-72" [(ngModel)]="raw"></textarea>
      </div>
      <div class="card p-4">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Encoded</div>
          <button class="btn-ghost text-xs px-2 py-1" (click)="dec()">← Decode</button>
        </div>
        <textarea class="input font-mono text-xs h-72" [(ngModel)]="encoded"></textarea>
      </div>
    </section>
  `,
})
export class DevUrl {
  protected raw = '';
  protected encoded = '';
  enc() { try { this.encoded = encodeURIComponent(this.raw); } catch {} }
  dec() { try { this.raw = decodeURIComponent(this.encoded); } catch {} }
}
