import { Injectable } from '@angular/core';

type AnyHandle = any;

@Injectable({ providedIn: 'root' })
export class FileSystemService {
  get supported() { return typeof window !== 'undefined' && 'showOpenFilePicker' in window; }

  async pickPdf(): Promise<{ file: File; handle: AnyHandle } | null> {
    if (!this.supported) return null;
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        excludeAcceptAllOption: false,
        multiple: false,
      });
      const file = await handle.getFile();
      return { file, handle };
    } catch { return null; }
  }

  async writeBack(handle: AnyHandle, data: BlobPart): Promise<boolean> {
    try {
      const w = await handle.createWritable();
      await w.write(data);
      await w.close();
      return true;
    } catch { return false; }
  }

  async saveAs(suggestedName: string, data: BlobPart, mime = 'application/pdf'): Promise<boolean> {
    if (!this.supported) return false;
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [{ description: mime, accept: { [mime]: ['.' + suggestedName.split('.').pop()] } }],
      });
      return this.writeBack(handle, data);
    } catch { return false; }
  }
}
