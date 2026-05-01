import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-hw-nfc',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="NFC Reader & Writer" subtitle="Read or write NFC tags using your phone — Chrome on Android only." icon="📡" color="from-emerald-500 to-cyan-600" />
    <section class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      @if (!supported()) {
        <div class="card p-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-sm text-amber-800 dark:text-amber-200">
          ⚠ Web NFC isn't supported on this device. Try Chrome on Android.
        </div>
      } @else {
        <div class="card p-2 flex gap-1">
          <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="mode() === 'read'" (click)="mode.set('read')">Read</button>
          <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="mode() === 'write'" (click)="mode.set('write')">Write</button>
        </div>

        @if (mode() === 'read') {
          <div class="card p-6 space-y-4">
            <button class="btn-primary w-full" (click)="read()" [disabled]="reading()">
              {{ reading() ? 'Hold tag near phone…' : '📡 Start scanning' }}
            </button>
            @if (records().length) {
              <div>
                <div class="text-xs font-semibold text-emerald-600 uppercase mb-2">✓ Tag detected</div>
                @for (r of records(); track $index) {
                  <div class="rounded-lg bg-slate-50 dark:bg-slate-800/40 p-3 mb-2 text-sm font-mono break-all">
                    <span class="text-slate-500 text-xs">{{ r.recordType }}</span><br/>{{ r.data }}
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="card p-6 space-y-4">
            <div>
              <label class="text-sm font-medium">Type</label>
              <select class="input mt-1" [(ngModel)]="writeType">
                <option value="text">Text</option>
                <option value="url">URL</option>
                <option value="wifi">WiFi credentials</option>
              </select>
            </div>
            @if (writeType === 'wifi') {
              <div class="grid grid-cols-2 gap-3">
                <input class="input" placeholder="SSID" [(ngModel)]="wifi.ssid" />
                <input class="input" placeholder="Password" [(ngModel)]="wifi.pwd" />
              </div>
            } @else {
              <input class="input" [placeholder]="writeType === 'url' ? 'https://example.com' : 'Hello!'" [(ngModel)]="writeData" />
            }
            <button class="btn-primary w-full" (click)="write()" [disabled]="writing()">
              {{ writing() ? 'Hold a tag near the phone…' : '✏ Write tag' }}
            </button>
          </div>
        }
      }
    </section>
  `,
})
export class HwNfc {
  private toast = inject(ToastService);
  protected supported = signal(typeof window !== 'undefined' && 'NDEFReader' in window);
  protected mode = signal<'read' | 'write'>('read');
  protected reading = signal(false);
  protected writing = signal(false);
  protected records = signal<{ recordType: string; data: string }[]>([]);
  protected writeType = 'text';
  protected writeData = '';
  protected wifi = { ssid: '', pwd: '' };

  async read() {
    try {
      const reader = new (window as any).NDEFReader();
      this.reading.set(true);
      this.records.set([]);
      await reader.scan();
      reader.onreading = (e: any) => {
        const decoded: { recordType: string; data: string }[] = [];
        for (const r of e.message.records) {
          let data = '';
          try {
            const dec = new TextDecoder(r.encoding || 'utf-8');
            data = dec.decode(r.data);
          } catch { data = '[binary]'; }
          decoded.push({ recordType: r.recordType, data });
        }
        this.records.set(decoded);
        this.reading.set(false);
        this.toast.success('Tag read.');
      };
      reader.onreadingerror = () => { this.reading.set(false); this.toast.error('Could not read tag.'); };
    } catch (e: any) {
      this.reading.set(false);
      this.toast.error(e?.message ?? 'Scan failed — permission denied?');
    }
  }

  async write() {
    try {
      const writer = new (window as any).NDEFReader();
      this.writing.set(true);
      let records: any[];
      if (this.writeType === 'url') records = [{ recordType: 'url', data: this.writeData }];
      else if (this.writeType === 'wifi') {
        const config = `WIFI:T:WPA;S:${this.wifi.ssid};P:${this.wifi.pwd};;`;
        records = [{ recordType: 'text', data: config }];
      } else records = [{ recordType: 'text', data: this.writeData }];
      await writer.write({ records });
      this.toast.success('Tag written successfully!');
    } catch (e: any) {
      this.toast.error(e?.message ?? 'Could not write tag.');
    } finally { this.writing.set(false); }
  }
}
