import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

interface HistoryItem {
  id: number; method: Method; url: string; status?: number;
  ms: number; at: number; preview: string;
}

const STORAGE_KEY = 'tv.apiTester.history.v1';

@Component({
  selector: 'app-api-tester',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="API Tester" subtitle="A mini-Postman for the browser — send REST requests, save history, inspect responses." icon="⚡" color="from-amber-500 to-orange-600" back="/dev" backLabel="Developer tools" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-[260px_1fr] gap-4">

      <div class="card p-3 lg:max-h-[80vh] lg:overflow-auto">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-bold uppercase tracking-widest text-slate-500">History</div>
          @if (history().length) { <button class="text-xs text-rose-600 hover:underline" (click)="clearHistory()">Clear</button> }
        </div>
        @if (!history().length) {
          <div class="text-xs text-slate-500 text-center py-6">No requests yet.</div>
        } @else {
          <ul class="space-y-1">
            @for (h of history(); track h.id) {
              <li>
                <button class="w-full text-left p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition" (click)="loadHistory(h)">
                  <div class="flex items-center gap-1.5 text-[10px] font-bold">
                    <span class="px-1.5 py-0.5 rounded {{ methodClass(h.method) }}">{{ h.method }}</span>
                    @if (h.status) {
                      <span [class.text-emerald-600]="h.status < 400" [class.text-rose-600]="h.status >= 400">{{ h.status }}</span>
                    }
                    <span class="text-slate-400 ml-auto">{{ h.ms }}ms</span>
                  </div>
                  <div class="text-xs text-slate-700 dark:text-slate-300 mt-1 truncate">{{ h.url }}</div>
                </button>
              </li>
            }
          </ul>
        }
      </div>

      <div class="space-y-4">
        <div class="card p-4 space-y-3">
          <div class="flex gap-2">
            <select class="input !w-28 font-mono font-bold" [(ngModel)]="method">
              @for (m of methods; track m) { <option [ngValue]="m">{{ m }}</option> }
            </select>
            <input class="input flex-1 font-mono text-sm" placeholder="https://api.example.com/users" [(ngModel)]="url" (keydown.enter)="send()" />
            <button class="btn-primary !px-6" (click)="send()" [disabled]="busy()">
              @if (busy()) { Sending… } @else { Send }
            </button>
          </div>

          <div class="flex gap-1 border-b border-slate-200 dark:border-slate-700">
            @for (t of tabs; track t) {
              <button class="px-3 py-1.5 text-xs font-medium border-b-2 transition"
                      [class.border-brand-500]="tab() === t" [class.text-brand-600]="tab() === t"
                      [class.border-transparent]="tab() !== t" [class.text-slate-500]="tab() !== t"
                      (click)="tab.set(t)">{{ t }}</button>
            }
          </div>

          @if (tab() === 'Params') {
            <div class="space-y-1.5">
              @for (p of params; track $index; let i = $index) {
                <div class="flex gap-2">
                  <input class="input flex-1 text-sm" placeholder="key" [(ngModel)]="p.k" (ngModelChange)="syncUrl()" />
                  <input class="input flex-1 text-sm" placeholder="value" [(ngModel)]="p.v" (ngModelChange)="syncUrl()" />
                  <button class="btn-ghost text-rose-600" (click)="removeParam(i)">✕</button>
                </div>
              }
              <button class="btn-ghost text-xs" (click)="addParam()">+ Add param</button>
            </div>
          }

          @if (tab() === 'Headers') {
            <div class="space-y-1.5">
              @for (h of headers; track $index; let i = $index) {
                <div class="flex gap-2">
                  <input class="input flex-1 text-sm font-mono" placeholder="X-Custom-Header" [(ngModel)]="h.k" />
                  <input class="input flex-1 text-sm font-mono" placeholder="value" [(ngModel)]="h.v" />
                  <button class="btn-ghost text-rose-600" (click)="removeHeader(i)">✕</button>
                </div>
              }
              <button class="btn-ghost text-xs" (click)="addHeader()">+ Add header</button>
            </div>
          }

          @if (tab() === 'Body') {
            <div>
              <div class="flex items-center gap-2 mb-2 text-xs">
                <label class="flex items-center gap-1"><input type="radio" name="btype" value="none" [(ngModel)]="bodyType" /> none</label>
                <label class="flex items-center gap-1"><input type="radio" name="btype" value="json" [(ngModel)]="bodyType" /> JSON</label>
                <label class="flex items-center gap-1"><input type="radio" name="btype" value="text" [(ngModel)]="bodyType" /> Text</label>
                <label class="flex items-center gap-1"><input type="radio" name="btype" value="form" [(ngModel)]="bodyType" /> Form</label>
              </div>
              @if (bodyType !== 'none') {
                <textarea class="input font-mono text-xs h-48" [placeholder]="bodyPlaceholder()" [(ngModel)]="body"></textarea>
              }
            </div>
          }

          @if (tab() === 'Auth') {
            <div class="space-y-2">
              <select class="input text-sm" [(ngModel)]="authType">
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key (header)</option>
              </select>
              @if (authType === 'bearer') {
                <input class="input font-mono text-xs" placeholder="Bearer token" [(ngModel)]="authBearer" />
              }
              @if (authType === 'basic') {
                <div class="grid grid-cols-2 gap-2">
                  <input class="input text-sm" placeholder="username" [(ngModel)]="authUser" />
                  <input type="password" class="input text-sm" placeholder="password" [(ngModel)]="authPass" />
                </div>
              }
              @if (authType === 'apikey') {
                <div class="grid grid-cols-2 gap-2">
                  <input class="input text-sm font-mono" placeholder="header name (e.g. X-API-Key)" [(ngModel)]="authKeyName" />
                  <input class="input text-sm font-mono" placeholder="value" [(ngModel)]="authKeyVal" />
                </div>
              }
            </div>
          }
        </div>

        @if (response()) {
          <div class="card p-4 space-y-2">
            <div class="flex items-center gap-3 text-sm">
              <span class="px-2 py-0.5 rounded font-mono font-bold"
                    [class.bg-emerald-100]="response()!.status < 400" [class.text-emerald-700]="response()!.status < 400"
                    [class.dark:bg-emerald-950]="response()!.status < 400" [class.dark:text-emerald-300]="response()!.status < 400"
                    [class.bg-rose-100]="response()!.status >= 400" [class.text-rose-700]="response()!.status >= 400"
                    [class.dark:bg-rose-950]="response()!.status >= 400" [class.dark:text-rose-300]="response()!.status >= 400">
                {{ response()!.status }} {{ response()!.statusText }}
              </span>
              <span class="text-slate-500">{{ response()!.ms }}ms</span>
              <span class="text-slate-500">{{ response()!.size }}</span>
              <button class="ml-auto btn-ghost text-xs" (click)="copyResponse()">Copy body</button>
            </div>

            <div class="flex gap-1 border-b border-slate-200 dark:border-slate-700">
              <button class="px-3 py-1.5 text-xs font-medium border-b-2"
                      [class.border-brand-500]="resTab() === 'body'"
                      [class.border-transparent]="resTab() !== 'body'"
                      (click)="resTab.set('body')">Body</button>
              <button class="px-3 py-1.5 text-xs font-medium border-b-2"
                      [class.border-brand-500]="resTab() === 'headers'"
                      [class.border-transparent]="resTab() !== 'headers'"
                      (click)="resTab.set('headers')">Headers ({{ response()!.headerCount }})</button>
            </div>

            @if (resTab() === 'body') {
              <pre class="font-mono text-xs bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-all">{{ response()!.body }}</pre>
            } @else {
              <pre class="font-mono text-xs bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3 max-h-[420px] overflow-auto">{{ response()!.headers }}</pre>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class ApiTester {
  protected methods: Method[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  protected tabs: ('Params' | 'Headers' | 'Body' | 'Auth')[] = ['Params', 'Headers', 'Body', 'Auth'];

  protected method: Method = 'GET';
  protected url = 'https://jsonplaceholder.typicode.com/todos/1';
  protected params: { k: string; v: string }[] = [];
  protected headers: { k: string; v: string }[] = [];
  protected bodyType: 'none' | 'json' | 'text' | 'form' = 'json';
  protected body = '';
  protected authType: 'none' | 'bearer' | 'basic' | 'apikey' = 'none';
  protected authBearer = ''; protected authUser = ''; protected authPass = '';
  protected authKeyName = ''; protected authKeyVal = '';

  protected tab = signal<'Params' | 'Headers' | 'Body' | 'Auth'>('Params');
  protected resTab = signal<'body' | 'headers'>('body');
  protected busy = signal(false);
  protected response = signal<{ status: number; statusText: string; body: string; headers: string; ms: number; size: string; headerCount: number } | null>(null);
  protected history = signal<HistoryItem[]>([]);

  constructor(private toast: ToastService) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.history.set(JSON.parse(raw));
    } catch {}
  }

  methodClass(m: Method) {
    switch (m) {
      case 'GET': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'POST': return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
      case 'PUT': case 'PATCH': return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
      case 'DELETE': return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  bodyPlaceholder() {
    return this.bodyType === 'json' ? '{ "key": "value" }'
      : this.bodyType === 'form' ? 'key1=value1&key2=value2'
      : 'raw body text';
  }

  addParam() { this.params.push({ k: '', v: '' }); }
  removeParam(i: number) { this.params.splice(i, 1); this.syncUrl(); }
  addHeader() { this.headers.push({ k: '', v: '' }); }
  removeHeader(i: number) { this.headers.splice(i, 1); }

  syncUrl() {
    try {
      const u = new URL(this.url);
      u.search = '';
      this.params.filter(p => p.k).forEach(p => u.searchParams.set(p.k, p.v));
      this.url = u.toString();
    } catch {}
  }

  async send() {
    if (!this.url.trim()) return;
    this.busy.set(true);
    const t0 = performance.now();
    try {
      const headers = new Headers();
      this.headers.filter(h => h.k).forEach(h => headers.set(h.k, h.v));
      if (this.authType === 'bearer' && this.authBearer) headers.set('Authorization', 'Bearer ' + this.authBearer);
      if (this.authType === 'basic') headers.set('Authorization', 'Basic ' + btoa(`${this.authUser}:${this.authPass}`));
      if (this.authType === 'apikey' && this.authKeyName) headers.set(this.authKeyName, this.authKeyVal);

      let body: BodyInit | undefined;
      if (this.method !== 'GET' && this.method !== 'HEAD' && this.bodyType !== 'none') {
        if (this.bodyType === 'json') { body = this.body; if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json'); }
        else if (this.bodyType === 'form') { body = this.body; if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/x-www-form-urlencoded'); }
        else { body = this.body; }
      }

      const res = await fetch(this.url, { method: this.method, headers, body });
      const ms = Math.round(performance.now() - t0);
      const text = await res.text();
      const size = text.length < 1024 ? text.length + ' B' : (text.length / 1024).toFixed(1) + ' KB';

      let pretty = text;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('json')) {
        try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      }

      const hdrLines: string[] = [];
      res.headers.forEach((v, k) => hdrLines.push(`${k}: ${v}`));

      this.response.set({
        status: res.status,
        statusText: res.statusText,
        body: pretty,
        headers: hdrLines.join('\n'),
        ms, size,
        headerCount: hdrLines.length,
      });

      this.pushHistory(res.status, ms, pretty.slice(0, 80));
    } catch (e: any) {
      this.response.set({
        status: 0, statusText: 'Network error',
        body: e?.message ?? 'Request failed (CORS, offline, or invalid URL)',
        headers: '', ms: Math.round(performance.now() - t0), size: '-', headerCount: 0,
      });
      this.toast.error('Request failed');
    } finally {
      this.busy.set(false);
    }
  }

  private pushHistory(status: number, ms: number, preview: string) {
    const entry: HistoryItem = {
      id: Date.now(), method: this.method, url: this.url, status, ms, at: Date.now(), preview,
    };
    const next = [entry, ...this.history()].slice(0, 30);
    this.history.set(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  loadHistory(h: HistoryItem) {
    this.method = h.method;
    this.url = h.url;
    this.toast.info('Loaded from history');
  }

  clearHistory() {
    this.history.set([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  async copyResponse() {
    if (!this.response()) return;
    try { await navigator.clipboard.writeText(this.response()!.body); this.toast.success('Copied'); } catch {}
  }
}
