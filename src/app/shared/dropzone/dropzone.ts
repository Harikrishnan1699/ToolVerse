import { Component, EventEmitter, Input, Output, signal } from '@angular/core';

@Component({
  selector: 'app-dropzone',
  template: `
    <label
      class="relative block cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-10 text-center"
      [class.border-brand-400]="hover()"
      [class.bg-brand-50]="hover()"
      [class.dark:bg-brand-950/30]="hover()"
      [class.border-slate-300]="!hover()"
      [class.dark:border-slate-700]="!hover()"
      (dragover)="onDrag($event, true)"
      (dragleave)="onDrag($event, false)"
      (drop)="onDrop($event)">
      <input type="file" class="sr-only" [accept]="accept" [multiple]="multiple" (change)="onPick($event)" />
      <div class="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 grid place-items-center text-white shadow-glow">
        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.9 5 5 0 019.71-1.5A4.5 4.5 0 0117 16h-1m-4-4v8m0-8l-3 3m3-3l3 3"/></svg>
      </div>
      <div class="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{{ title }}</div>
      <div class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</div>
      <div class="mt-5 inline-flex items-center btn-primary">Choose files</div>
    </label>
  `,
})
export class Dropzone {
  @Input() title = 'Drop files here';
  @Input() subtitle = 'or click to browse from your device';
  @Input() accept = 'application/pdf';
  @Input() multiple = false;
  @Output() files = new EventEmitter<File[]>();
  protected hover = signal(false);

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
    if (list && list.length) this.files.emit(Array.from(list));
  }

  onPick(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.length) {
      this.files.emit(Array.from(input.files));
      input.value = '';
    }
  }
}
