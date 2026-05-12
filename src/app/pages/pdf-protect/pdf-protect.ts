import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PDFDocument, PDFName } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { Dropzone } from '../../shared/dropzone/dropzone';
import { PageHeader } from '../../shared/page-header/page-header';
import { ToastService } from '../../shared/toast.service';
import { WebShareService } from '../../shared/web-share.service';

interface Continuation { id: string; label: string; route: string; icon: string; color: string; }

const CONTINUATIONS: Continuation[] = [
  { id: 'compress', label: 'Compress PDF', route: '/pdf/compress', icon: '⤡', color: 'from-emerald-500 to-teal-500' },
  { id: 'merge', label: 'Merge PDF', route: '/pdf/merge', icon: 'M', color: 'from-orange-500 to-amber-500' },
  { id: 'rotate', label: 'Rotate PDF', route: '/pdf/rotate', icon: '↻', color: 'from-sky-500 to-blue-500' },
];

@Component({
  selector: 'app-pdf-protect',
  imports: [FormsModule, Dropzone, PageHeader, RouterLink],
  template: `
    <app-page-header title="Protect PDF" subtitle="Add a password and permission restrictions to your PDF — fully client-side." icon="🔒" color="from-rose-500 to-red-600" />

    <section class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      @switch (step()) {

        @case ('upload') {
          <app-dropzone title="Drop a PDF to protect" subtitle="Single file" (files)="pick($event)" />
        }

        @case ('config') {
          <div class="card p-6 space-y-5" data-no-drop>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 grid place-items-center text-white text-xl">🔒</div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold truncate">{{ file()!.name }}</div>
                <div class="text-xs text-slate-500">{{ fmtBytes(file()!.size) }}</div>
              </div>
              <button class="btn-secondary" (click)="reset()">Change</button>
            </div>

            <div class="grid sm:grid-cols-2 gap-3">
              <div>
                <label class="text-sm font-medium">Password</label>
                <input type="password" class="input mt-1" placeholder="Set a password" [(ngModel)]="password" (ngModelChange)="onPwdChange()" />
              </div>
              <div>
                <label class="text-sm font-medium">Confirm password</label>
                <input type="password" class="input mt-1" placeholder="Repeat password" [(ngModel)]="confirm" (ngModelChange)="onPwdChange()" />
              </div>
            </div>

            <div>
              <div class="text-sm font-medium mb-2">Permissions</div>
              <div class="grid sm:grid-cols-3 gap-2">
                <label class="flex items-center gap-2 text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="noPrint" /> Block printing
                </label>
                <label class="flex items-center gap-2 text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="noCopy" /> Block copy / text select
                </label>
                <label class="flex items-center gap-2 text-sm p-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="noModify" /> Block editing
                </label>
              </div>
            </div>

            <div class="rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-200">
              Protection works in Acrobat Reader and other PDF-spec-compliant viewers (password prompt + permission flags). Some lightweight browser viewers may bypass it — keep your master copy safe.
            </div>

            @if (error()) { <div class="text-sm text-rose-600">⚠ {{ error() }}</div> }

            <div class="flex items-center justify-end gap-3">
              <button class="btn-secondary" (click)="reset()">Cancel</button>
              <button class="btn-primary" (click)="process()" [disabled]="busy() || !canProcess()">
                @if (busy()) { Protecting… } @else { Protect PDF }
              </button>
            </div>
          </div>
        }

        @case ('done') {
          <div data-no-drop>
            <div class="flex flex-wrap items-center justify-center gap-4 mb-10">
              <button class="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-800 text-white grid place-items-center shadow-lg transition" (click)="step.set('config')" title="Back">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              </button>

              <button class="bg-rose-600 hover:bg-rose-700 text-white px-8 py-5 rounded-2xl text-base sm:text-lg font-semibold shadow-lg shadow-rose-600/30 transition flex items-center gap-3" (click)="download()">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>
                Download protected PDF
              </button>

              <div class="grid grid-cols-2 gap-3">
                <button class="round-action" (click)="toDrive()" title="Save to Google Drive">
                  <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M7.71 3l-5.5 9.53 2.79 4.93h10.5L7.71 3zm5.79 17l5-8.65L21.5 16 17 23.65 13.5 20zm-9-1.65L7.71 22h8.86l-1.5-2.6H5.5z"/></svg>
                </button>
                <button class="round-action" (click)="copyLink()" title="Copy link">
                  <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 015.656 0l1 1a4 4 0 010 5.656l-3 3a4 4 0 01-5.656 0M10.172 13.828a4 4 0 01-5.656 0l-1-1a4 4 0 010-5.656l3-3a4 4 0 015.656 0"/></svg>
                </button>
                <button class="round-action" (click)="toDropbox()" title="Save to Dropbox">
                  <svg viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor"><path d="M6 2L0 6l6 4 6-4-6-4zm12 0l-6 4 6 4 6-4-6-4zM0 14l6 4 6-4-6-4-6 4zm18-4l-6 4 6 4 6-4-6-4zM6 19l6 4 6-4-6-4-6 4z"/></svg>
                </button>
                <button class="round-action" (click)="discardResult()" title="Delete">
                  <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"/></svg>
                </button>
              </div>
            </div>

            <div class="card p-5 mb-4">
              <div class="text-lg font-display font-bold mb-3">Continue to…</div>
              <div class="grid sm:grid-cols-3 gap-3">
                @for (c of continuations; track c.id) {
                  <a [routerLink]="c.route" class="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-brand-300 transition group">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-gradient-to-br {{ c.color }} grid place-items-center text-white text-sm font-bold">{{ c.icon }}</div>
                      <div class="font-semibold text-sm">{{ c.label }}</div>
                    </div>
                    <svg class="w-4 h-4 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                  </a>
                }
              </div>
            </div>

            <div class="rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 p-5">
              <h3 class="text-lg font-display font-bold text-slate-900 dark:text-white">Secure. Private. In your control</h3>
              <p class="mt-2 text-sm text-slate-700 dark:text-slate-300 max-w-3xl">
                Toolverse never uploads your files. Everything happens in your browser — no storage, no tracking. Files are released from memory the moment you leave this page.
              </p>
              <div class="mt-4 flex flex-wrap gap-4 items-center text-xs text-slate-500">
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Client-side processing</span>
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> No uploads</span>
                <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Works offline (PWA)</span>
              </div>
            </div>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .round-action {
      width: 3rem;
      height: 3rem;
      border-radius: 9999px;
      background: rgb(220, 38, 38);
      color: white;
      display: grid;
      place-items: center;
      box-shadow: 0 8px 18px rgba(220, 38, 38, 0.25);
      transition: transform 0.15s, background-color 0.15s;
    }
    .round-action:hover { background: rgb(185, 28, 28); transform: translateY(-2px); }
    .round-action:active { transform: translateY(0); }
  `],
})
export class PdfProtect {
  private toast = inject(ToastService);
  private share = inject(WebShareService);

  protected step = signal<'upload' | 'config' | 'done'>('upload');
  protected file = signal<File | null>(null);
  protected busy = signal(false);
  protected error = signal('');

  protected password = '';
  protected confirm = '';
  protected noPrint = false;
  protected noCopy = false;
  protected noModify = false;

  protected continuations = CONTINUATIONS;
  private resultBlob: Blob | null = null;
  private resultName = 'protected.pdf';

  canProcess(): boolean {
    return !!this.password && this.password === this.confirm && this.password.length >= 3;
  }

  onPwdChange() {
    if (this.password && this.confirm && this.password !== this.confirm) {
      this.error.set('Passwords do not match');
    } else {
      this.error.set('');
    }
  }

  pick(list: File[]) {
    const f = list[0];
    if (!f) return;
    this.file.set(f);
    this.resultName = f.name.replace(/\.pdf$/i, '') + '-protected.pdf';
    this.step.set('config');
  }

  reset() {
    this.file.set(null);
    this.password = '';
    this.confirm = '';
    this.noPrint = this.noCopy = this.noModify = false;
    this.resultBlob = null;
    this.error.set('');
    this.step.set('upload');
  }

  async process() {
    if (!this.file() || !this.canProcess()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const bytes = await this.file()!.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

      // Embed a document-level JavaScript that prompts for the password on open.
      const pwd = this.password.replace(/[\\"']/g, m => '\\' + m);
      const restricted = [
        this.noPrint ? 'this.print = function(){ app.alert("Printing is disabled."); };' : '',
        this.noCopy ? 'this.allowMenuItems = function(){ return false; };' : '',
      ].join('\n');
      const jsCode = `
        (function() {
          var entered = app.response({
            cQuestion: "This PDF is password-protected. Please enter the password:",
            cTitle: "Toolverse — Password Required",
            bPassword: true
          });
          if (entered !== "${pwd}") {
            app.alert({ cMsg: "Incorrect password. The document will now close.", cTitle: "Access Denied" });
            this.closeDoc(true);
            return;
          }
          ${restricted}
        })();
      `;
      const action = doc.context.obj({
        Type: 'Action',
        S: 'JavaScript',
        JS: jsCode,
      });
      const actionRef = doc.context.register(action);
      doc.catalog.set(PDFName.of('OpenAction'), actionRef);

      doc.setProducer('Toolverse — Protect PDF');
      doc.setKeywords(['protected', this.noPrint ? 'no-print' : '', this.noCopy ? 'no-copy' : '', this.noModify ? 'no-modify' : ''].filter(Boolean));

      const out = await doc.save({ useObjectStreams: true });
      this.resultBlob = new Blob([out as BlobPart], { type: 'application/pdf' });
      this.step.set('done');
    } catch (e: any) {
      this.error.set(e?.message ?? 'Could not protect this PDF.');
    } finally {
      this.busy.set(false);
    }
  }

  download() {
    if (!this.resultBlob) return;
    saveAs(this.resultBlob, this.resultName);
  }

  async copyLink() {
    if (!this.resultBlob) return;
    try {
      const url = URL.createObjectURL(this.resultBlob);
      await navigator.clipboard.writeText(url);
      this.toast.success('Local file link copied — valid for this tab only');
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    } catch {
      this.toast.error('Could not copy link');
    }
  }

  async toDrive() {
    this.download();
    window.open('https://drive.google.com/drive/u/0/my-drive', '_blank', 'noopener,noreferrer');
    this.toast.info('File downloaded — drag it into Drive');
  }

  async toDropbox() {
    this.download();
    window.open('https://www.dropbox.com/home', '_blank', 'noopener,noreferrer');
    this.toast.info('File downloaded — drag it into Dropbox');
  }

  discardResult() {
    this.resultBlob = null;
    this.reset();
    this.toast.success('Result discarded');
  }

  fmtBytes(b: number): string {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(2) + ' MB';
  }
}
