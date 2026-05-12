import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../shared/page-header/page-header';

@Component({
  selector: 'app-pdf-html',
  imports: [FormsModule, PageHeader],
  template: `
    <app-page-header title="HTML to PDF" subtitle="Paste HTML or a URL and save it as a PDF using your browser's print engine." icon="</>" color="from-amber-500 to-yellow-500" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="card p-6 space-y-4" data-no-drop>
        <div class="flex items-center gap-2">
          <button class="btn-secondary text-xs" [class.!bg-brand-50]="mode() === 'html'" (click)="mode.set('html')">Paste HTML</button>
          <button class="btn-secondary text-xs" [class.!bg-brand-50]="mode() === 'url'" (click)="mode.set('url')">From URL</button>
        </div>

        @if (mode() === 'html') {
          <div>
            <label class="text-sm font-medium">HTML source</label>
            <textarea class="input mt-1 font-mono text-xs h-64" placeholder="<h1>Hello</h1>" [(ngModel)]="html"></textarea>
          </div>
        } @else {
          <div>
            <label class="text-sm font-medium">URL (must allow same-origin embedding — many sites block this)</label>
            <input class="input mt-1" placeholder="https://example.com" [(ngModel)]="url" />
            <p class="text-xs text-slate-500 mt-1">Tip: paste HTML for best results — most external sites use <code>X-Frame-Options</code>/CSP that prevent embedding.</p>
          </div>
        }

        <button class="btn-primary" (click)="print()" [disabled]="busy()">
          @if (busy()) { Preparing… } @else { Save as PDF }
        </button>
        @if (error()) { <div class="text-sm text-rose-600">{{ error() }}</div> }
        <p class="text-xs text-slate-500">A print dialog will open — choose <strong>Save as PDF</strong> as the destination.</p>
      </div>

      <iframe #frame class="hidden" sandbox="allow-same-origin allow-modals"></iframe>
    </section>
  `,
})
export class PdfHtml {
  @ViewChild('frame') frameRef?: ElementRef<HTMLIFrameElement>;
  protected mode = signal<'html' | 'url'>('html');
  protected html = '<h1 style="font-family:Inter,Arial">Hello from Toolverse</h1>\n<p>Edit this HTML and click <strong>Save as PDF</strong>.</p>';
  protected url = '';
  protected busy = signal(false);
  protected error = signal('');

  async print() {
    this.busy.set(true); this.error.set('');
    try {
      const f = this.frameRef!.nativeElement;
      f.classList.remove('hidden');
      f.style.position = 'fixed'; f.style.inset = '0'; f.style.width = '0'; f.style.height = '0'; f.style.opacity = '0';

      if (this.mode() === 'html') {
        const doc = f.contentDocument!;
        doc.open();
        doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Inter,system-ui,Arial,sans-serif;color:#0f172a;padding:24px;line-height:1.5}@page{margin:18mm}</style></head><body>${this.html}</body></html>`);
        doc.close();
        await new Promise(r => setTimeout(r, 200));
        f.contentWindow!.focus();
        f.contentWindow!.print();
      } else {
        if (!this.url.trim()) throw new Error('Enter a URL.');
        f.src = this.url;
        await new Promise<void>((res, rej) => {
          f.onload = () => res();
          f.onerror = () => rej(new Error('Could not load URL.'));
          setTimeout(() => res(), 5000);
        });
        try { f.contentWindow!.focus(); f.contentWindow!.print(); }
        catch { throw new Error('That site refused to be embedded (CSP/X-Frame-Options). Try pasting the HTML instead.'); }
      }
    } catch (e: any) { this.error.set(e?.message ?? 'Failed'); }
    finally { this.busy.set(false); }
  }
}
