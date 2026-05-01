import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SectionHeader } from '../../shared/section-header/section-header';

const LANGS: { code: string; name: string }[] = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' }, { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' }, { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
  { code: 'nl', name: 'Dutch' }, { code: 'ru', name: 'Russian' }, { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' }, { code: 'zh', name: 'Chinese' }, { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' }, { code: 'tr', name: 'Turkish' }, { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' }, { code: 'th', name: 'Thai' }, { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' }, { code: 'el', name: 'Greek' }, { code: 'he', name: 'Hebrew' },
];

@Component({
  selector: 'app-text-translate',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Translator" subtitle="Translate text between 20+ languages — powered by free MyMemory API." icon="🌐" color="from-cyan-500 to-blue-600" />
    <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-5">
      <div class="card p-6">
        <div class="grid lg:grid-cols-[1fr_auto_1fr] gap-3 items-end mb-4">
          <select class="input" [(ngModel)]="from">
            <option value="auto">Auto-detect</option>
            @for (l of langs; track l.code) { <option [value]="l.code">{{ l.name }}</option> }
          </select>
          <button class="btn-secondary self-end h-12 w-12 !p-0 grid place-items-center" (click)="swap()">⇄</button>
          <select class="input" [(ngModel)]="to">
            @for (l of langs; track l.code) { <option [value]="l.code">{{ l.name }}</option> }
          </select>
        </div>
        <div class="grid lg:grid-cols-2 gap-4">
          <textarea class="input font-mono text-sm h-60" [(ngModel)]="src" placeholder="Type or paste text…"></textarea>
          <textarea class="input font-mono text-sm h-60 !bg-slate-50 dark:!bg-slate-800/40" readonly [value]="dst()"></textarea>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button class="btn-primary" (click)="translate()" [disabled]="loading() || !src.trim()">
            {{ loading() ? 'Translating…' : 'Translate' }}
          </button>
          <button class="btn-secondary text-xs" (click)="speak()" [disabled]="!dst()">🔊 Listen</button>
        </div>
        @if (error()) { <div class="mt-3 text-sm text-rose-600">{{ error() }}</div> }
        <div class="mt-3 text-xs text-slate-500">⚠ Free tier limited to ~5,000 chars/day per IP. For private/long text, use a paid API.</div>
      </div>
    </section>
  `,
})
export class TextTranslate {
  private http = inject(HttpClient);
  protected langs = LANGS;
  protected from = 'en';
  protected to = 'es';
  protected src = '';
  protected dst = signal('');
  protected loading = signal(false);
  protected error = signal('');

  swap() {
    if (this.from === 'auto') return;
    [this.from, this.to] = [this.to, this.from];
    this.src = this.dst();
    this.dst.set('');
  }

  async translate() {
    if (!this.src.trim()) return;
    this.loading.set(true); this.error.set('');
    try {
      const langpair = (this.from === 'auto' ? '' : this.from) + '|' + this.to;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(this.src)}&langpair=${langpair}`;
      const res = await firstValueFrom(this.http.get<any>(url));
      this.dst.set(res.responseData?.translatedText ?? '');
    } catch { this.error.set('Translation failed (rate limit or network).'); }
    finally { this.loading.set(false); }
  }

  speak() {
    if (!this.dst() || typeof speechSynthesis === 'undefined') return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(this.dst());
    u.lang = this.to;
    speechSynthesis.speak(u);
  }
}
