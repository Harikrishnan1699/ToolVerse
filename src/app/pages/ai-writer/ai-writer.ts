import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';
import { AiWriterService, AiSettings, AiProvider, LtMatch } from './ai-writer.service';

const PROVIDERS: { id: AiProvider; label: string; free: string }[] = [
  { id: 'free',      label: '🎁 Free (no key)',  free: 'Powered by Hack Club AI + Pollinations fallback — no signup, rate-limited but instant' },
  { id: 'gemini',    label: 'Google Gemini',     free: 'Free tier: aistudio.google.com — generous monthly quota' },
  { id: 'groq',      label: 'Groq (Llama)',      free: 'Free tier: console.groq.com — very fast Llama-3 inference' },
  { id: 'openai',    label: 'OpenAI GPT',        free: 'Paid only — bring your platform.openai.com key' },
  { id: 'anthropic', label: 'Anthropic Claude',  free: 'Paid only — bring your console.anthropic.com key' },
];

interface AiPreset { id: string; label: string; icon: string; prompt: (t: string) => string; }

const AI_PRESETS: AiPreset[] = [
  { id: 'rewrite',    label: 'Rewrite',        icon: '✎', prompt: t => `Rewrite the following text to be clearer and more polished. Keep the original meaning and same overall length.\n\n---\n${t}` },
  { id: 'shorten',    label: 'Make shorter',   icon: '↧', prompt: t => `Rewrite the following text more concisely. Keep the meaning intact but cut filler.\n\n---\n${t}` },
  { id: 'expand',     label: 'Make longer',    icon: '↥', prompt: t => `Expand the following text with more detail and examples, keeping the same tone.\n\n---\n${t}` },
  { id: 'formal',     label: 'More formal',    icon: '🎩', prompt: t => `Rewrite the following text in a more formal, professional tone.\n\n---\n${t}` },
  { id: 'casual',     label: 'More casual',    icon: '☕', prompt: t => `Rewrite the following text in a casual, friendly tone.\n\n---\n${t}` },
  { id: 'persuasive', label: 'Persuasive',     icon: '🎯', prompt: t => `Rewrite the following text to be more persuasive and engaging.\n\n---\n${t}` },
  { id: 'bullets',    label: 'To bullets',     icon: '⋮', prompt: t => `Convert the following text into a clean bulleted list. Use "-" for bullets, no extra commentary.\n\n---\n${t}` },
  { id: 'summarize',  label: 'Summarize',      icon: '∑', prompt: t => `Summarize the following text in 2-3 sentences.\n\n---\n${t}` },
  { id: 'fix-grammar',label: 'Fix grammar',    icon: '✓', prompt: t => `Correct grammar, spelling and punctuation. Do not change meaning or style. Output only the corrected text.\n\n---\n${t}` },
];

@Component({
  selector: 'app-ai-writer',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header
      title="AI Writing Assistant"
      subtitle="Real-time grammar, style & rewriting — free LanguageTool engine plus optional AI rewrites (Gemini / Groq / OpenAI / Claude)."
      icon="✍"
      color="from-indigo-500 to-fuchsia-600"
      back="/"
      backLabel="Home" />

    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div class="grid lg:grid-cols-[1fr_360px] gap-5">

        <!-- LEFT: editor -->
        <div class="card overflow-hidden flex flex-col" style="min-height: 540px;">
          <div class="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
            <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">Your text</div>
            <select class="input !w-auto !py-1 !px-2 text-xs ml-2" [(ngModel)]="language" (ngModelChange)="onLanguageChange()">
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="auto">Auto-detect</option>
            </select>
            <label class="inline-flex items-center gap-2 text-xs cursor-pointer ml-auto">
              <input type="checkbox" class="w-3.5 h-3.5 accent-brand-500" [(ngModel)]="autoCheck" />
              <span class="text-slate-600 dark:text-slate-300">Auto-check</span>
            </label>
            <button class="btn-ghost text-xs px-2 py-1" (click)="loadSample()">Sample</button>
            <button class="btn-ghost text-xs px-2 py-1" (click)="clear()">Clear</button>
            <button class="btn-primary text-xs !py-1.5 !px-3" (click)="runCheck()" [disabled]="checking()">
              @if (checking()) { Checking… } @else { ✓ Check }
            </button>
          </div>

          <div class="relative flex-1 grid">
            <div #overlay class="pointer-events-none absolute inset-0 px-4 py-3 font-mono text-sm leading-relaxed text-transparent whitespace-pre-wrap overflow-auto" aria-hidden="true">
              <span [innerHTML]="highlighted()"></span>
            </div>
            <textarea
              #ta
              class="relative bg-transparent w-full h-full min-h-[460px] px-4 py-3 font-mono text-sm leading-relaxed outline-none resize-none text-slate-900 dark:text-slate-100"
              spellcheck="false"
              placeholder="Type or paste your text here. Click ✓ Check for grammar & style suggestions, or pick an AI rewrite preset on the right."
              [(ngModel)]="text"
              (ngModelChange)="onTextChange()"
              (scroll)="syncScroll()"></textarea>
          </div>

          <div class="flex flex-wrap items-center gap-3 px-3 py-1.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-xs text-slate-500">
            <span>{{ wordCount() }} words · {{ charCount() }} chars</span>
            <span class="flex-1"></span>
            <span [class.text-emerald-600]="!matches().length && lastChecked()" [class.text-rose-600]="matches().length">
              @if (lastChecked()) {
                @if (matches().length) { ⚠ {{ matches().length }} issue(s) found } @else { ✓ No issues found }
              } @else { Press ✓ Check to scan }
            </span>
          </div>
        </div>

        <!-- RIGHT: tabs (Issues / AI / Settings) -->
        <div class="space-y-4">
          <div class="card p-2 flex gap-1">
            @for (t of tabs; track t.id) {
              <button class="flex-1 text-xs font-medium px-2 py-1.5 rounded-lg transition"
                      [class.bg-brand-500]="tab() === t.id" [class.text-white]="tab() === t.id"
                      [class.text-slate-600]="tab() !== t.id" [class.dark:text-slate-300]="tab() !== t.id"
                      [class.hover:bg-slate-100]="tab() !== t.id" [class.dark:hover:bg-slate-800]="tab() !== t.id"
                      (click)="tab.set(t.id)">{{ t.icon }} {{ t.label }}</button>
            }
          </div>

          @switch (tab()) {

            @case ('issues') {
              <div class="card p-4">
                <div class="flex items-center justify-between mb-3">
                  <div class="text-sm font-semibold">{{ matches().length }} issue(s)</div>
                  @if (matches().length) {
                    <button class="btn-ghost text-xs px-2 py-1 text-rose-600" (click)="dismissAll()">Dismiss all</button>
                  }
                </div>

                @if (!matches().length) {
                  <div class="text-center py-8 text-sm text-slate-500">
                    <div class="text-3xl mb-2">{{ lastChecked() ? '✨' : '📝' }}</div>
                    <div>{{ lastChecked() ? 'Your text looks great!' : 'No issues yet — run a check above.' }}</div>
                  </div>
                } @else {
                  <ul class="space-y-2.5 max-h-[460px] overflow-auto -mr-2 pr-2">
                    @for (m of matches(); track $index; let i = $index) {
                      <li class="rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:border-brand-300 transition">
                        <div class="flex items-start gap-2">
                          <div class="w-6 h-6 rounded-md grid place-items-center text-xs font-bold shrink-0"
                               [class.bg-rose-100]="issueKind(m) === 'grammar'"
                               [class.text-rose-700]="issueKind(m) === 'grammar'"
                               [class.bg-amber-100]="issueKind(m) === 'style'"
                               [class.text-amber-700]="issueKind(m) === 'style'"
                               [class.bg-sky-100]="issueKind(m) === 'spelling'"
                               [class.text-sky-700]="issueKind(m) === 'spelling'">
                            {{ issueKind(m) === 'grammar' ? 'G' : issueKind(m) === 'style' ? 'S' : 'Sp' }}
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="text-xs text-slate-500 mb-0.5">{{ m.rule?.category?.name || 'Issue' }}</div>
                            <div class="text-sm font-medium leading-snug">{{ m.shortMessage || m.message }}</div>
                            @if (m.shortMessage && m.message && m.shortMessage !== m.message) {
                              <div class="text-xs text-slate-500 mt-1 leading-snug">{{ m.message }}</div>
                            }
                            <div class="mt-2 inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                              "{{ snippetAt(m) }}"
                            </div>
                            @if (m.replacements.length) {
                              <div class="mt-2 flex flex-wrap gap-1.5">
                                @for (r of m.replacements.slice(0, 6); track $index; let j = $index) {
                                  <button class="px-2 py-1 rounded-md text-xs bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 transition"
                                          (click)="applyOne(i, j)">{{ r.value || '(remove)' }}</button>
                                }
                              </div>
                            }
                          </div>
                          <button class="text-slate-400 hover:text-rose-600 text-xs" title="Dismiss" (click)="dismiss(i)">✕</button>
                        </div>
                      </li>
                    }
                  </ul>
                  @if (matches().length > 1) {
                    <button class="btn-primary w-full mt-3 text-sm" (click)="applyAllSuggestions()">Apply all first suggestions</button>
                  }
                }
              </div>
            }

            @case ('ai') {
              <div class="card p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-semibold">AI rewrite</div>
                  <span class="text-[10px] text-slate-500">{{ settings.provider }} · {{ settings.model || '—' }}</span>
                </div>

                @if (needsKey() && !settings.apiKey) {
                  <div class="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 text-xs text-amber-800 dark:text-amber-200">
                    Add your API key in <button class="underline font-semibold" (click)="tab.set('settings')">Settings</button>, or switch to <button class="underline font-semibold" (click)="setProvider('free')">🎁 Free (no key)</button> to start instantly.
                  </div>
                } @else if (!needsKey()) {
                  <div class="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-200">
                    ✓ Using the free no-key provider — rate-limited but instant. Switch to a personal key in <button class="underline font-semibold" (click)="tab.set('settings')">Settings</button> for higher limits.
                  </div>
                }

                <div class="grid grid-cols-3 gap-1.5">
                  @for (p of presets; track p.id) {
                    <button class="rounded-lg p-2 text-xs hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-slate-200 dark:border-slate-700 hover:border-brand-300 transition flex flex-col items-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            [disabled]="!canRunAi() || aiBusy()"
                            (click)="runPreset(p)">
                      <span class="text-base">{{ p.icon }}</span>
                      <span class="leading-tight text-center">{{ p.label }}</span>
                    </button>
                  }
                </div>

                <div>
                  <label class="text-xs font-medium">Custom prompt</label>
                  <textarea class="input mt-1 text-xs h-20" placeholder="e.g. Translate to Spanish · Make it sound like a tweet · Add a strong opening sentence" [(ngModel)]="customPrompt"></textarea>
                  <button class="btn-secondary w-full mt-2 text-sm" [disabled]="!canRunAi() || aiBusy() || !customPrompt.trim() || !text.trim()" (click)="runCustom()">
                    @if (aiBusy()) { Generating… } @else { Run custom prompt }
                  </button>
                </div>

                @if (aiOutput()) {
                  <div class="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                    <div class="flex items-center justify-between mb-2">
                      <div class="text-xs font-semibold">AI suggestion</div>
                      <div class="flex gap-1">
                        <button class="btn-ghost text-xs px-2 py-1" (click)="copyAi()">Copy</button>
                        <button class="btn-primary text-xs !py-1 !px-2" (click)="acceptAi()">Replace</button>
                      </div>
                    </div>
                    <div class="text-sm whitespace-pre-wrap max-h-64 overflow-auto">{{ aiOutput() }}</div>
                  </div>
                }

                @if (aiError()) {
                  <div class="text-xs text-rose-600 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">⚠ {{ aiError() }}</div>
                }
              </div>
            }

            @case ('settings') {
              <div class="card p-4 space-y-3">
                <div class="text-sm font-semibold">AI provider</div>
                <div class="grid grid-cols-2 gap-2">
                  @for (p of providers; track p.id) {
                    <button class="rounded-lg p-2.5 text-left text-xs border transition"
                            [class.border-brand-500]="settings.provider === p.id"
                            [class.bg-brand-50]="settings.provider === p.id"
                            [class.dark:bg-brand-950/40]="settings.provider === p.id"
                            [class.border-slate-200]="settings.provider !== p.id"
                            [class.dark:border-slate-700]="settings.provider !== p.id"
                            (click)="setProvider(p.id)">
                      <div class="font-semibold text-slate-900 dark:text-white">{{ p.label }}</div>
                      <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{{ p.free }}</div>
                    </button>
                  }
                </div>

                @if (needsKey()) {
                  <div>
                    <label class="text-xs font-medium">API key</label>
                    <input type="password" class="input mt-1 text-sm" placeholder="Paste your key — stored only in your browser" [(ngModel)]="settings.apiKey" (ngModelChange)="saveSettings()" />
                  </div>
                } @else {
                  <div class="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3 text-xs text-emerald-800 dark:text-emerald-200">
                    🎁 No key needed — Toolverse routes your prompt to the free Hack Club AI endpoint, with a Pollinations fallback. Expect rate-limits during peak times.
                  </div>
                }

                <div>
                  <label class="text-xs font-medium">Model (override)</label>
                  <input class="input mt-1 text-sm font-mono" [placeholder]="defaultModel(settings.provider)" [(ngModel)]="settings.model" (ngModelChange)="saveSettings()" />
                </div>

                <div class="rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 p-3 text-xs text-sky-900 dark:text-sky-200 space-y-1.5">
                  <div class="font-semibold">🔒 Privacy</div>
                  <ul class="list-disc list-inside space-y-0.5 leading-snug">
                    <li>Your text is sent only to the provider you choose.</li>
                    <li>The API key is stored in <code>localStorage</code> — never sent to Toolverse.</li>
                    <li>Grammar checks use the public LanguageTool API (no key).</li>
                  </ul>
                </div>

                @if (settings.apiKey) {
                  <button class="btn-secondary w-full text-sm" (click)="clearKey()">Clear API key</button>
                }
              </div>
            }
          }

          <div class="card p-4 bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/30 dark:to-sky-950/30 text-xs text-slate-700 dark:text-slate-300">
            <div class="font-semibold mb-1.5 text-slate-900 dark:text-white">✨ How it works</div>
            <ul class="list-disc list-inside space-y-0.5 leading-snug">
              <li><strong>Grammar / spelling</strong>: LanguageTool free public API.</li>
              <li><strong>Rewrite / tone / generate</strong>: bring your own AI key.</li>
              <li><strong>Free options</strong>: Google AI Studio or Groq both have free tiers.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host ::ng-deep mark.lt-mark {
      background-color: transparent;
      color: transparent;
      border-bottom: 2px solid rgba(244, 63, 94, 0.85);
      border-radius: 2px;
    }
    :host ::ng-deep mark.lt-style {
      border-bottom-color: rgba(245, 158, 11, 0.9);
    }
    :host ::ng-deep mark.lt-spelling {
      border-bottom-color: rgba(14, 165, 233, 0.9);
      border-bottom-style: wavy;
    }
  `],
})
export class AiWriter {
  @ViewChild('ta') taRef?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('overlay') overlayRef?: ElementRef<HTMLDivElement>;

  private svc = inject(AiWriterService);
  private toast = inject(ToastService);

  protected providers = PROVIDERS;
  protected presets = AI_PRESETS;
  protected tabs = [
    { id: 'issues' as const,   label: 'Issues',   icon: '⚠' },
    { id: 'ai' as const,       label: 'AI',       icon: '✨' },
    { id: 'settings' as const, label: 'Settings', icon: '⚙' },
  ];

  protected text = '';
  protected language = 'en-US';
  protected autoCheck = false;
  protected tab = signal<'issues' | 'ai' | 'settings'>('issues');
  protected checking = signal(false);
  protected lastChecked = signal(false);
  protected matches = signal<LtMatch[]>([]);
  protected customPrompt = '';
  protected aiBusy = signal(false);
  protected aiOutput = signal('');
  protected aiError = signal('');

  protected settings: AiSettings;

  protected wordCount = computed(() => this.text.trim() ? this.text.trim().split(/\s+/).length : 0);
  protected charCount = computed(() => this.text.length);

  protected highlighted = signal('');

  private autoTimer: any = null;

  constructor() {
    this.settings = this.svc.loadSettings();
  }

  defaultModel(p: AiProvider) { return this.svc.defaultModel(p); }
  needsKey() { return this.svc.needsKey(this.settings.provider); }
  canRunAi() { return !this.needsKey() || !!this.settings.apiKey; }

  setProvider(p: AiProvider) {
    this.settings.provider = p;
    this.settings.model = this.svc.defaultModel(p);
    this.saveSettings();
  }

  saveSettings() { this.svc.saveSettings(this.settings); }

  clearKey() {
    this.settings.apiKey = '';
    this.saveSettings();
    this.toast.success('API key cleared');
  }

  loadSample() {
    this.text = 'Their are many reasons why grammer matter alot in modern writing. It dont just help with clarity, but also for making a impression on you reader. Many people think its boring, but actualy a single misplaced apostrophe can completly change the meaning of a sentance.';
    this.onTextChange();
  }

  clear() {
    this.text = '';
    this.matches.set([]);
    this.lastChecked.set(false);
    this.aiOutput.set('');
    this.refreshHighlight();
  }

  onTextChange() {
    this.refreshHighlight();
    if (this.autoCheck) this.scheduleAutoCheck();
  }

  onLanguageChange() {
    if (this.lastChecked() || this.autoCheck) this.runCheck();
  }

  private scheduleAutoCheck() {
    if (this.autoTimer) clearTimeout(this.autoTimer);
    this.autoTimer = setTimeout(() => this.runCheck(), 800);
  }

  async runCheck() {
    if (!this.text.trim()) { this.matches.set([]); this.lastChecked.set(true); this.refreshHighlight(); return; }
    this.checking.set(true);
    try {
      const ms = await this.svc.grammarCheck(this.text, this.language);
      this.matches.set(ms);
      this.lastChecked.set(true);
      this.refreshHighlight();
      if (ms.length) {
        this.toast.info(`${ms.length} suggestion${ms.length === 1 ? '' : 's'} found`);
        this.tab.set('issues');
      } else {
        this.toast.success('No issues found');
      }
    } catch (e: any) {
      this.toast.error('Grammar check failed: ' + (e?.message ?? 'unknown'));
    } finally {
      this.checking.set(false);
    }
  }

  applyOne(matchIdx: number, replacementIdx: number) {
    const m = this.matches()[matchIdx];
    if (!m) return;
    const newText = this.svc.applyMatches(this.text, [m], { 0: replacementIdx });
    const delta = (m.replacements[replacementIdx]?.value?.length ?? 0) - m.length;
    this.text = newText;
    this.matches.update(arr => {
      const next = arr.filter((_, i) => i !== matchIdx);
      return next.map(x => x.offset > m.offset ? { ...x, offset: x.offset + delta } : x);
    });
    this.refreshHighlight();
    this.toast.success('Applied suggestion');
  }

  applyAllSuggestions() {
    const matches = [...this.matches()].filter(m => m.replacements?.length);
    const choose: Record<number, number> = {};
    matches.forEach((_, i) => choose[i] = 0);
    this.text = this.svc.applyMatches(this.text, matches, choose);
    this.matches.set([]);
    this.lastChecked.set(true);
    this.refreshHighlight();
    this.toast.success(`Applied ${matches.length} suggestion${matches.length === 1 ? '' : 's'}`);
  }

  dismiss(i: number) { this.matches.update(arr => arr.filter((_, idx) => idx !== i)); this.refreshHighlight(); }
  dismissAll() { this.matches.set([]); this.refreshHighlight(); }

  issueKind(m: LtMatch): 'grammar' | 'style' | 'spelling' {
    const it = (m.rule?.issueType ?? '').toLowerCase();
    const cat = (m.rule?.category?.id ?? '').toLowerCase();
    if (it.includes('misspelling') || cat.includes('typo') || cat.includes('possible_typo')) return 'spelling';
    if (it.includes('style') || cat.includes('style') || cat.includes('redundancy') || cat.includes('plain_english')) return 'style';
    return 'grammar';
  }

  snippetAt(m: LtMatch): string {
    return this.text.slice(m.offset, m.offset + m.length);
  }

  refreshHighlight() {
    const t = this.text;
    const ms = this.matches();
    if (!t) { this.highlighted.set(''); return; }
    if (!ms.length) { this.highlighted.set(this.escape(t)); return; }
    const sorted = [...ms].sort((a, b) => a.offset - b.offset);
    let out = '';
    let cursor = 0;
    for (const m of sorted) {
      if (m.offset < cursor) continue;
      out += this.escape(t.slice(cursor, m.offset));
      const kind = this.issueKind(m);
      const cls = kind === 'spelling' ? 'lt-mark lt-spelling' : kind === 'style' ? 'lt-mark lt-style' : 'lt-mark';
      out += `<mark class="${cls}">${this.escape(t.slice(m.offset, m.offset + m.length))}</mark>`;
      cursor = m.offset + m.length;
    }
    out += this.escape(t.slice(cursor));
    this.highlighted.set(out + '\n');
  }

  private escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  syncScroll() {
    const ta = this.taRef?.nativeElement, ov = this.overlayRef?.nativeElement;
    if (ta && ov) { ov.scrollTop = ta.scrollTop; ov.scrollLeft = ta.scrollLeft; }
  }

  async runPreset(p: AiPreset) {
    if (!this.text.trim()) { this.toast.warn('Type some text first'); return; }
    await this.callAi(p.prompt(this.text));
  }

  async runCustom() {
    if (!this.customPrompt.trim() || !this.text.trim()) return;
    await this.callAi(`${this.customPrompt}\n\n---\n${this.text}`);
  }

  private async callAi(prompt: string) {
    this.aiBusy.set(true);
    this.aiError.set('');
    this.aiOutput.set('');
    try {
      const result = await this.svc.runAi(prompt, this.settings);
      this.aiOutput.set(result.trim());
    } catch (e: any) {
      this.aiError.set(e?.message ?? 'AI call failed');
    } finally {
      this.aiBusy.set(false);
    }
  }

  acceptAi() {
    if (!this.aiOutput()) return;
    this.text = this.aiOutput();
    this.aiOutput.set('');
    this.matches.set([]);
    this.lastChecked.set(false);
    this.refreshHighlight();
    this.toast.success('Replaced with AI suggestion');
    this.tab.set('issues');
  }

  async copyAi() {
    try { await navigator.clipboard.writeText(this.aiOutput()); this.toast.success('Copied'); } catch {}
  }
}
