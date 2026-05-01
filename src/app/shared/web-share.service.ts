import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebShareService {
  get supported() { return typeof navigator !== 'undefined' && 'share' in navigator; }

  canShareFiles(files: File[]) {
    return this.supported && (navigator as any).canShare?.({ files });
  }

  async share(data: ShareData): Promise<boolean> {
    if (!this.supported) {
      try {
        if (data.url) await navigator.clipboard.writeText(data.url);
        else if (data.text) await navigator.clipboard.writeText(data.text);
        return true;
      } catch { return false; }
    }
    try { await navigator.share(data); return true; }
    catch (e: any) { return e?.name === 'AbortError' ? false : false; }
  }

  async shareFile(file: File, fallbackName?: string): Promise<boolean> {
    if (this.canShareFiles([file])) {
      return this.share({ files: [file], title: file.name });
    }
    // Fallback: download
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = fallbackName ?? file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }
}
