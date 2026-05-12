import { Injectable } from '@angular/core';

let pdfjsPromise: Promise<any> | null = null;

async function loadPdfjs(): Promise<any> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs: any = await import('pdfjs-dist');
      try {
        const worker: any = await import('pdfjs-dist/build/pdf.worker.min.mjs?url' as any);
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default
          ?? new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
      } catch {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
      }
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export interface RenderedPage {
  pageNumber: number;
  width: number;
  height: number;
  dataUrl: string;
}

@Injectable({ providedIn: 'root' })
export class PdfRenderService {
  async loadDoc(bytes: ArrayBuffer): Promise<any> {
    const pdfjs = await loadPdfjs();
    return await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
  }

  async renderPageToDataUrl(doc: any, pageNumber: number, scale = 0.5, format = 'image/jpeg', quality = 0.82): Promise<RenderedPage> {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const dataUrl = canvas.toDataURL(format, quality);
    return { pageNumber, width: viewport.width, height: viewport.height, dataUrl };
  }

  async renderAllThumbnails(
    bytes: ArrayBuffer,
    scale = 0.4,
    onProgress?: (done: number, total: number) => void,
  ): Promise<RenderedPage[]> {
    const doc = await this.loadDoc(bytes);
    const out: RenderedPage[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      out.push(await this.renderPageToDataUrl(doc, i, scale));
      onProgress?.(i, doc.numPages);
    }
    return out;
  }

  async renderFirstPage(bytes: ArrayBuffer, scale = 1): Promise<RenderedPage> {
    const doc = await this.loadDoc(bytes);
    return await this.renderPageToDataUrl(doc, 1, scale);
  }
}
