import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject, signal } from '@angular/core';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-dropzone',
  template: `
    <label
      class="dz relative block cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center group"
      [class.dz-hover]="hover()"
      [class.border-slate-300]="!hover()"
      [class.dark:border-slate-700]="!hover()"
      (dragover)="onDrag($event, true)"
      (dragleave)="onDrag($event, false)"
      (drop)="onDrop($event)">
      <input type="file" class="sr-only" [accept]="accept" [multiple]="multiple" (change)="onPick($event)" />
      <div class="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white shadow-glow transform group-hover:scale-105 transition">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.71-1.5A4.5 4.5 0 0117 16h-1m-4-4v8m0-8l-3 3m3-3l3 3"/></svg>
      </div>
      <div class="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{{ title }}</div>
      <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</div>
      <div class="mt-5 inline-flex items-center gap-2 btn-primary">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Choose files
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span class="inline-flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Drag & drop</span>
        <span class="opacity-40">·</span>
        <span class="inline-flex items-center gap-1"><kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Ctrl</kbd>+<kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">V</kbd> Paste image / file</span>
        <span class="opacity-40">·</span>
        <span class="inline-flex items-center gap-1">Tap to browse</span>
      </div>
    </label>
  `,
  styles: [`
    .dz-hover {
      border-color: rgb(99 102 241);
      background: rgba(99, 102, 241, 0.08);
    }
    :host-context(.dark) .dz-hover { background: rgba(99, 102, 241, 0.18); }
  `],
})
export class Dropzone implements OnInit {
  @Input() title = 'Drop files here';
  @Input() subtitle = 'or click to browse from your device';
  @Input() accept = 'application/pdf';
  @Input() multiple = false;
  /** When true, accept clipboard paste (Ctrl/Cmd+V) anywhere on the page. Default: true. */
  @Input() acceptPaste = true;
  @Output() files = new EventEmitter<File[]>();
  protected hover = signal(false);
  private toast = inject(ToastService);

  ngOnInit() {}

  onDrag(e: DragEvent, hovering: boolean) {
    e.preventDefault();
    e.stopPropagation();
    this.hover.set(hovering);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.hover.set(false);
    const list = e.dataTransfer?.files;
    if (list && list.length) this.files.emit(this.filterAccept(Array.from(list)));
  }

  onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      this.files.emit(Array.from(input.files));
      input.value = '';
    }
  }

  @HostListener('document:paste', ['$event'])
  onPaste(e: ClipboardEvent) {
    if (!this.acceptPaste) return;
    const target = e.target as HTMLElement | null;
    if (target && this.isEditableTarget(target)) return;

    const items = e.clipboardData?.items;
    if (!items?.length) return;

    const collected: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) collected.push(file);
      }
    }
    if (!collected.length) return;

    const accepted = this.filterAccept(collected);
    if (!accepted.length) {
      this.toast.warn(`Pasted file isn't supported here (need ${this.accept})`);
      return;
    }

    e.preventDefault();
    const normalised = accepted.map(f => this.ensureName(f));
    this.files.emit(this.multiple ? normalised : [normalised[0]]);
    this.toast.success(`Pasted ${normalised.length} file${normalised.length === 1 ? '' : 's'} from clipboard`);
  }

  private isEditableTarget(el: HTMLElement): boolean {
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return el.isContentEditable;
  }

  private filterAccept(list: File[]): File[] {
    if (!this.accept || this.accept === '*' || this.accept === '*/*') return list;
    const patterns = this.accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    return list.filter(f => patterns.some(p => {
      if (p.startsWith('.')) return f.name.toLowerCase().endsWith(p);
      if (p.endsWith('/*')) return f.type.toLowerCase().startsWith(p.slice(0, -1));
      return f.type.toLowerCase() === p;
    }));
  }

  private ensureName(f: File): File {
    if (f.name && f.name !== 'image.png' && f.name !== 'unknown') return f;
    const ext = (f.type.split('/')[1] || 'bin').replace('jpeg', 'jpg');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return new File([f], `pasted-${stamp}.${ext}`, { type: f.type, lastModified: Date.now() });
  }
}
