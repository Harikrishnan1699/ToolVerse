import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FfmpegService {
  private ff: any | null = null;
  readonly loading = signal(false);
  readonly progress = signal(0);

  async load(): Promise<any> {
    if (this.ff) return this.ff;
    this.loading.set(true);
    try {
      const ffmpegMod: any = await import('@ffmpeg/ffmpeg');
      const utilMod: any = await import('@ffmpeg/util');
      const ff = new ffmpegMod.FFmpeg();
      ff.on('progress', (e: any) => this.progress.set(Math.min(100, Math.round((e.progress ?? 0) * 100))));
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
      await ff.load({
        coreURL: await utilMod.toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await utilMod.toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      this.ff = ff;
      return ff;
    } finally {
      this.loading.set(false);
    }
  }

  async writeFile(name: string, file: File | Blob | Uint8Array): Promise<void> {
    const ff = await this.load();
    const utilMod: any = await import('@ffmpeg/util');
    const data = file instanceof Uint8Array ? file : await utilMod.fetchFile(file);
    await ff.writeFile(name, data);
  }

  async readFile(name: string): Promise<Uint8Array> {
    const ff = await this.load();
    return await ff.readFile(name);
  }

  async exec(args: string[]): Promise<void> {
    const ff = await this.load();
    await ff.exec(args);
  }
}
