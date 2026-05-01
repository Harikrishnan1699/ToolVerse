import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { saveAs } from 'file-saver';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { SectionHeader } from '../../shared/section-header/section-header';

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

interface Sig { type: 'offer' | 'answer'; sdp: string; }

@Component({
  selector: 'app-hw-p2p',
  imports: [FormsModule, Dropzone, SectionHeader],
  template: `
    <app-section-header title="P2P File Transfer" subtitle="Send files browser-to-browser via WebRTC — no upload, no size limit." icon="📡" color="from-violet-500 to-fuchsia-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-2 flex gap-1">
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="role() === 'send'" (click)="role.set('send')">📤 Send</button>
        <button class="btn-ghost text-xs px-3 py-1.5" [class.!bg-brand-50]="role() === 'receive'" (click)="role.set('receive')">📥 Receive</button>
      </div>

      @if (role() === 'send') {
        <div class="card p-6 space-y-4">
          @if (!file()) { <app-dropzone title="Pick a file to send" (files)="pickFile($event)" accept="*" /> }
          @else {
            <div class="flex items-center gap-3"><div class="flex-1"><div class="font-semibold">{{ file()!.name }}</div><div class="text-xs text-slate-500">{{ fmt(file()!.size) }}</div></div><button class="btn-secondary text-xs" (click)="file.set(null)">Change</button></div>
            @if (!offerCode()) { <button class="btn-primary w-full" (click)="createOffer()">Generate connection code</button> }
            @else {
              <div>
                <div class="text-xs font-semibold uppercase text-slate-500 mb-2">Step 1: Send this code to receiver</div>
                <textarea class="input font-mono text-xs h-32" readonly [value]="offerCode()"></textarea>
                <button class="btn-secondary text-xs mt-2" (click)="copy(offerCode())">Copy</button>
              </div>
              <div>
                <div class="text-xs font-semibold uppercase text-slate-500 mb-2 mt-4">Step 2: Paste receiver's reply code</div>
                <textarea class="input font-mono text-xs h-32" [(ngModel)]="answerInput"></textarea>
                <button class="btn-primary mt-2" (click)="acceptAnswer()" [disabled]="!answerInput.trim()">Connect & send</button>
              </div>
            }
          }
        </div>
      } @else {
        <div class="card p-6 space-y-4">
          @if (!offerInput) {
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500 mb-2">Step 1: Paste sender's code</div>
              <textarea class="input font-mono text-xs h-32" [(ngModel)]="offerInput"></textarea>
              <button class="btn-primary mt-2" (click)="acceptOffer()" [disabled]="!offerInput.trim()">Generate reply</button>
            </div>
          }
          @if (answerCode()) {
            <div>
              <div class="text-xs font-semibold uppercase text-slate-500 mb-2">Step 2: Send this reply back to sender</div>
              <textarea class="input font-mono text-xs h-32" readonly [value]="answerCode()"></textarea>
              <button class="btn-secondary text-xs mt-2" (click)="copy(answerCode())">Copy</button>
            </div>
          }
        </div>
      }

      @if (status()) {
        <div class="card p-4 text-sm">
          <div class="font-semibold">{{ status() }}</div>
          @if (progress() > 0) {
            <div class="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-brand-500 to-fuchsia-500 transition-all" [style.width.%]="progress()"></div>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class HwP2p {
  protected role = signal<'send' | 'receive'>('send');
  protected file = signal<File | null>(null);
  protected offerCode = signal('');
  protected answerCode = signal('');
  protected offerInput = '';
  protected answerInput = '';
  protected status = signal('');
  protected progress = signal(0);
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private receivedChunks: ArrayBuffer[] = [];
  private receivedMeta: { name: string; size: number; type: string } | null = null;

  pickFile(list: File[]) { this.file.set(list[0] ?? null); }

  fmt(b: number) { return b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB'; }

  async copy(s: string) { try { await navigator.clipboard.writeText(s); this.status.set('Copied!'); } catch {} }

  async createOffer() {
    if (!this.file()) return;
    this.pc = new RTCPeerConnection(ICE);
    this.dc = this.pc.createDataChannel('file');
    this.dc.binaryType = 'arraybuffer';
    this.dc.onopen = () => this.sendFile();
    this.pc.onicegatheringstatechange = () => {
      if (this.pc?.iceGatheringState === 'complete') {
        this.offerCode.set(btoa(JSON.stringify(this.pc.localDescription)));
      }
    };
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.status.set('Connection code generated. Send to receiver.');
  }

  async acceptAnswer() {
    if (!this.pc) return;
    try {
      const ans = JSON.parse(atob(this.answerInput));
      await this.pc.setRemoteDescription(ans);
      this.status.set('Connecting…');
    } catch { this.status.set('Invalid reply code.'); }
  }

  async acceptOffer() {
    try {
      const offer = JSON.parse(atob(this.offerInput));
      this.pc = new RTCPeerConnection(ICE);
      this.pc.ondatachannel = (e) => {
        this.dc = e.channel;
        this.dc.binaryType = 'arraybuffer';
        this.dc.onmessage = (ev) => this.onChunk(ev.data);
      };
      this.pc.onicegatheringstatechange = () => {
        if (this.pc?.iceGatheringState === 'complete') {
          this.answerCode.set(btoa(JSON.stringify(this.pc.localDescription)));
        }
      };
      await this.pc.setRemoteDescription(offer);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.status.set('Reply generated. Send to sender.');
    } catch { this.status.set('Invalid sender code.'); }
  }

  private async sendFile() {
    if (!this.dc || !this.file()) return;
    const f = this.file()!;
    this.dc.send(JSON.stringify({ name: f.name, size: f.size, type: f.type }));
    const reader = f.stream().getReader();
    let sent = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      // Backpressure
      while (this.dc.bufferedAmount > 16 * 1024 * 1024) await new Promise(r => setTimeout(r, 30));
      this.dc.send(value.buffer);
      sent += value.byteLength;
      this.progress.set((sent / f.size) * 100);
    }
    this.dc.send('__END__');
    this.status.set(`✓ Sent ${this.fmt(sent)}`);
  }

  private onChunk(data: any) {
    if (typeof data === 'string') {
      if (data === '__END__') {
        const blob = new Blob(this.receivedChunks, { type: this.receivedMeta?.type });
        saveAs(blob, this.receivedMeta?.name ?? 'received');
        this.status.set(`✓ Received ${this.receivedMeta?.name}`);
        this.receivedChunks = []; this.receivedMeta = null;
      } else {
        try { this.receivedMeta = JSON.parse(data); this.receivedChunks = []; this.status.set(`Receiving ${this.receivedMeta!.name}…`); } catch {}
      }
    } else {
      this.receivedChunks.push(data);
      if (this.receivedMeta) {
        const total = this.receivedChunks.reduce((s, c) => s + c.byteLength, 0);
        this.progress.set((total / this.receivedMeta.size) * 100);
      }
    }
  }
}
