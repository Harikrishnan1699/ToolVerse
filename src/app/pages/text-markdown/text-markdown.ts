import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';

@Component({
  selector: 'app-text-markdown',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Markdown Editor" subtitle="Live-preview Markdown editor with full GFM syntax support." icon="MD" color="from-cyan-500 to-blue-600" />
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="grid lg:grid-cols-2 gap-4">
        <div class="card p-4">
          <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Markdown</div>
          <textarea class="input font-mono text-xs h-[600px]" [(ngModel)]="md" (ngModelChange)="render()"></textarea>
        </div>
        <div class="card p-4">
          <div class="text-xs font-semibold text-slate-500 uppercase mb-2">Preview</div>
          <div class="prose prose-sm dark:prose-invert max-w-none h-[600px] overflow-auto p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40" [innerHTML]="html()"></div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host ::ng-deep .prose h1 { font-size: 1.6em; font-weight: 700; margin: .8em 0 .4em; }
    :host ::ng-deep .prose h2 { font-size: 1.3em; font-weight: 700; margin: .8em 0 .4em; }
    :host ::ng-deep .prose h3 { font-size: 1.1em; font-weight: 600; margin: .8em 0 .4em; }
    :host ::ng-deep .prose p { margin: .5em 0; }
    :host ::ng-deep .prose code { background: rgba(127,127,127,.15); padding: 1px 5px; border-radius: 4px; font-family: monospace; }
    :host ::ng-deep .prose pre { background: #0f172a; color: #f1f5f9; padding: 12px; border-radius: 8px; overflow-x: auto; }
    :host ::ng-deep .prose pre code { background: transparent; padding: 0; }
    :host ::ng-deep .prose blockquote { border-left: 3px solid #cbd5e1; padding-left: 12px; color: #64748b; margin: .5em 0; }
    :host ::ng-deep .prose ul, .prose ol { padding-left: 22px; margin: .5em 0; }
    :host ::ng-deep .prose ul { list-style: disc; }
    :host ::ng-deep .prose ol { list-style: decimal; }
    :host ::ng-deep .prose a { color: #3a5cff; text-decoration: underline; }
    :host ::ng-deep .prose table { border-collapse: collapse; width: 100%; margin: .5em 0; }
    :host ::ng-deep .prose th, .prose td { border: 1px solid #cbd5e1; padding: 6px 10px; }
    :host ::ng-deep .prose img { max-width: 100%; }
  `]
})
export class TextMarkdown {
  protected md = `# Welcome to Toolverse

A **modern**, _all-in-one_ utility hub.

## Features
- 50+ tools
- 100% client-side
- Free forever

\`\`\`js
console.log('Hello, world!');
\`\`\`

> "Tools that respect your privacy."

[Visit](https://example.com)
`;
  protected html = signal('');

  constructor() { this.render(); }

  async render() {
    const { marked }: any = await import('marked');
    this.html.set(marked.parse(this.md));
  }
}
