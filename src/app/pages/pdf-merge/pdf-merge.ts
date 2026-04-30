import { Component, signal } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';

interface PdfFile { file: File; size: string; }

@Component({
  selector: 'app-pdf-merge',
  imports: [Dropzone, PageHeader],
  template: `
    <app-page-header title="Merge PDF" subtitle="Combine multiple PDFs into one document, in any order." icon="M" color="from-orange-500 to-amber-500" />

    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @if (files().length === 0) {
        <app-dropzone title="Drop PDF files here" subtitle="Pick two or more PDFs to merge — drag to reorder afterwards" [multiple]="true" (files)="addFiles($event)" />
      } @else {
        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm text-slate-600 dark:text-slate-400">{{ files().length }} file(s) — drag to reorder</div>
            <label class="btn-secondary cursor-pointer">
              + Add more
              <input type="file" class="hidden" multiple accept="application/pdf" (change)="onAdd($event)" />
            </label>
          </div>

          <ul class="space-y-2">
            @for (f of files(); track f.file.name; let i = $index) {
              <li
                class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-move"
                draggable="true"
                (dragstart)="dragIndex.set(i)"
                (dragover)="$event.preventDefault()"
                (drop)="reorder(i)">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 grid place-items-center text-white text-xs font-bold">PDF</div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ f.file.name }}</div>
                  <div class="text-xs text-slate-500">{{ f.size }}</div>
                </div>
                <button (click)="move(i,-1)" class="btn-ghost px-2 py-1 text-xs" [disabled]="i===0">↑</button>
                <button (click)="move(i,1)" class="btn-ghost px-2 py-1 text-xs" [disabled]="i===files().length-1">↓</button>
                <button (click)="remove(i)" class="btn-ghost px-2 py-1 text-xs text-rose-600">Remove</button>
              </li>
            }
          </ul>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button class="btn-secondary" (click)="clear()">Clear</button>
            <button class="btn-primary" (click)="merge()" [disabled]="busy()">
              @if (busy()) { Merging… } @else { Merge & download }
            </button>
          </div>

          @if (error()) { <div class="mt-4 text-sm text-rose-600">{{ error() }}</div> }
        </div>
      }
    </section>
  `,
})
export class PdfMerge {
  protected files = signal<PdfFile[]>([]);
  protected busy = signal(false);
  protected error = signal('');
  protected dragIndex = signal<number | null>(null);

  addFiles(list: File[]) {
    const pdfs = list.filter(f => f.type === 'application/pdf');
    this.files.update(arr => [...arr, ...pdfs.map(f => ({ file: f, size: this.fmt(f.size) }))]);
  }

  onAdd(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  move(i: number, dir: -1 | 1) {
    const arr = [...this.files()];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    this.files.set(arr);
  }

  reorder(target: number) {
    const from = this.dragIndex();
    if (from == null || from === target) return;
    const arr = [...this.files()];
    const [moved] = arr.splice(from, 1);
    arr.splice(target, 0, moved);
    this.files.set(arr);
    this.dragIndex.set(null);
  }

  remove(i: number) { this.files.update(arr => arr.filter((_, idx) => idx !== i)); }
  clear() { this.files.set([]); this.error.set(''); }

  async merge() {
    if (this.files().length < 2) { this.error.set('Please add at least 2 PDF files.'); return; }
    this.busy.set(true); this.error.set('');
    try {
      const out = await PDFDocument.create();
      for (const f of this.files()) {
        const bytes = await f.file.arrayBuffer();
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach(p => out.addPage(p));
      }
      const result = await out.save();
      saveAs(new Blob([result as BlobPart], { type: 'application/pdf' }), 'toolverse-merged.pdf');
    } catch (e: any) {
      this.error.set('Merge failed: ' + (e?.message ?? 'unknown error'));
    } finally {
      this.busy.set(false);
    }
  }

  private fmt(b: number) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }
}
