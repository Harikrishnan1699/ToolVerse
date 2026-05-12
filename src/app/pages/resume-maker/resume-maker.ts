import { Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet, LowerCasePipe } from '@angular/common';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';
import { AiWriterService, AiSettings } from '../ai-writer/ai-writer.service';

type TemplateId =
  | 'classic' | 'modern' | 'two-column' | 'professional' | 'ats' | 'minimal'
  | 'executive' | 'creative' | 'designer' | 'tech';
type FontFamily = 'sans' | 'serif' | 'mono';
type Density = 'compact' | 'normal' | 'spacious';

interface Experience { id: string; title: string; company: string; location: string; start: string; end: string; current: boolean; bullets: string; }
interface Education  { id: string; degree: string; school: string; location: string; start: string; end: string; description: string; }
interface Skill      { id: string; name: string; level: number; }
interface Project    { id: string; name: string; description: string; url: string; tech: string; }
interface Lang       { id: string; name: string; level: string; }
interface Cert       { id: string; name: string; issuer: string; date: string; }
interface Award      { id: string; name: string; issuer: string; date: string; }
interface Volunteer  { id: string; role: string; organization: string; start: string; end: string; description: string; }
interface CustomItem { id: string; line1: string; line2: string; description: string; }
interface CustomSec  { id: string; title: string; items: CustomItem[]; }
interface Preset     { id: string; name: string; template: TemplateId; color: string; font: FontFamily; fontSize: number; density: Density; }

interface Resume {
  template: TemplateId;
  color: string;
  font: FontFamily;
  fontSize: number;
  density: Density;
  showPhoto: boolean;
  personal: {
    name: string; title: string; photo: string;
    email: string; phone: string; location: string;
    website: string; linkedin: string; summary: string;
  };
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  languages: Lang[];
  certifications: Cert[];
  awards: Award[];
  volunteer: Volunteer[];
  interests: string;
  customSections: CustomSec[];
  order: string[];
}

const STORAGE_KEY  = 'tv.resumeMaker.v1';
const PRESETS_KEY  = 'tv.resumeMaker.presets.v1';

const COLOR_PRESETS = [
  '#0f766e', '#9a3412', '#1e3a8a', '#5b21b6', '#1f2937', '#0e7490',
  '#be123c', '#15803d', '#ca8a04', '#7c3aed', '#0369a1', '#db2777',
];

const TEMPLATES: { id: TemplateId; name: string; subtitle: string; tags: string[]; }[] = [
  { id: 'classic',      name: 'Classic',      subtitle: 'Single column, traditional',         tags: ['ATS', 'Simple'] },
  { id: 'modern',       name: 'Modern',       subtitle: 'Bold headings, clean spacing',       tags: ['ATS'] },
  { id: 'two-column',   name: 'Two column',   subtitle: 'Sidebar for contacts & skills',      tags: ['Photo'] },
  { id: 'professional', name: 'Professional', subtitle: 'Dark sidebar, photo prominent',      tags: ['Photo'] },
  { id: 'ats',          name: 'Pure ATS',     subtitle: 'No graphics, scanner-friendly',      tags: ['ATS', 'Simple'] },
  { id: 'minimal',      name: 'Minimal',      subtitle: 'Whitespace-first, elegant',          tags: ['Simple'] },
  { id: 'executive',    name: 'Executive',    subtitle: 'Centered headline, formal serif',    tags: ['ATS', 'Formal'] },
  { id: 'creative',     name: 'Creative',     subtitle: 'Gradient header band',               tags: ['Color'] },
  { id: 'designer',     name: 'Designer',     subtitle: 'Visual blocks, large photo',         tags: ['Photo', 'Color'] },
  { id: 'tech',         name: 'Tech',         subtitle: 'Monospace, code-style headings',     tags: ['ATS'] },
];

const DEFAULT_RESUME: Resume = {
  template: 'professional',
  color: '#0f766e',
  font: 'serif',
  fontSize: 10,
  density: 'normal',
  showPhoto: true,
  personal: {
    name: 'Alex Morgan',
    title: 'Senior Software Engineer',
    photo: '',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 010-2210',
    location: 'Brooklyn, NY',
    website: 'alexmorgan.dev',
    linkedin: 'linkedin.com/in/alexmorgan',
    summary: 'Senior software engineer with 8+ years building scalable web platforms. Specialised in TypeScript, distributed systems and product-led teams. Led a 6-person team that shipped a real-time collaboration product serving 200k DAU.',
  },
  experience: [
    { id: crypto.randomUUID(), title: 'Senior Software Engineer', company: 'Acme Cloud', location: 'Remote', start: 'Jan 2022', end: 'Present', current: true,
      bullets: 'Led migration of monolith to event-driven microservices, cutting p95 latency by 47%.\nMentored 4 engineers; ran weekly design reviews and a quarterly architecture forum.\nDrove adoption of feature flags — reduced rollback rate from 8.4% to 1.1%.' },
    { id: crypto.randomUUID(), title: 'Software Engineer', company: 'Northwind Labs', location: 'New York, NY', start: 'Jun 2018', end: 'Dec 2021', current: false,
      bullets: 'Built collaborative editor sync layer (OT/CRDT) handling 12k concurrent sessions.\nShipped accessibility audit pipeline, raising Lighthouse score from 67 → 96.' },
  ],
  education: [
    { id: crypto.randomUUID(), degree: 'B.S. Computer Science', school: 'NYU Tandon', location: 'New York', start: '2014', end: '2018', description: 'Dean\'s list; research assistant in HCI lab.' },
  ],
  skills: [
    { id: crypto.randomUUID(), name: 'TypeScript', level: 5 },
    { id: crypto.randomUUID(), name: 'React / Angular', level: 5 },
    { id: crypto.randomUUID(), name: 'Node.js', level: 4 },
    { id: crypto.randomUUID(), name: 'PostgreSQL', level: 4 },
    { id: crypto.randomUUID(), name: 'AWS', level: 4 },
    { id: crypto.randomUUID(), name: 'GraphQL', level: 3 },
  ],
  projects: [
    { id: crypto.randomUUID(), name: 'Toolverse', description: 'Privacy-first browser toolkit — 100+ tools running 100% client-side.', url: 'toolverse.app', tech: 'Angular 21, TypeScript, WASM' },
  ],
  languages: [
    { id: crypto.randomUUID(), name: 'English', level: 'Native' },
    { id: crypto.randomUUID(), name: 'Spanish', level: 'Conversational' },
  ],
  certifications: [
    { id: crypto.randomUUID(), name: 'AWS Solutions Architect — Professional', issuer: 'Amazon Web Services', date: '2023' },
  ],
  awards: [],
  volunteer: [],
  interests: '',
  customSections: [],
  order: ['summary', 'experience', 'education', 'skills', 'projects', 'languages', 'certifications', 'awards', 'volunteer', 'interests'],
};

@Component({
  selector: 'app-resume-maker',
  imports: [FormsModule, NgTemplateOutlet, LowerCasePipe, SectionHeader],
  template: `
    @if (!fullscreen()) {
      <app-section-header title="Resume Maker" subtitle="Live preview, 10 templates, AI rewrites, drag-to-order, export as PDF." icon="📄" color="from-emerald-500 to-teal-600" back="/" backLabel="Home" />
    }

    <section class="resume-shell mx-auto px-3 sm:px-4 lg:px-6 pb-12" [class.fullscreen-mode]="fullscreen()">

      <!-- Top toolbar -->
      <div class="no-print card p-2 mb-3 flex flex-wrap items-center gap-2 sticky z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur"
           [class.top-16]="!fullscreen()"
           [class.top-2]="fullscreen()">
        <div class="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button class="px-3 py-1 text-sm font-medium rounded-md transition" [class.bg-white]="tab() === 'edit'" [class.dark:bg-slate-700]="tab() === 'edit'" [class.shadow-sm]="tab() === 'edit'" (click)="tab.set('edit')">✏ Edit</button>
          <button class="px-3 py-1 text-sm font-medium rounded-md transition" [class.bg-white]="tab() === 'customize'" [class.dark:bg-slate-700]="tab() === 'customize'" [class.shadow-sm]="tab() === 'customize'" (click)="tab.set('customize')">🎨 Customize</button>
          <button class="px-3 py-1 text-sm font-medium rounded-md transition relative" [class.bg-white]="tab() === 'ai'" [class.dark:bg-slate-700]="tab() === 'ai'" [class.shadow-sm]="tab() === 'ai'" (click)="tab.set('ai')">
            ✨ AI
            <span class="absolute -top-1 -right-1 px-1 py-0 text-[8px] font-bold bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white rounded">PRO</span>
          </button>
        </div>
        <span class="text-xs text-slate-500 hidden sm:inline">Auto-saved · {{ templateName() }} · {{ pageCount() }} page(s)</span>
        <span class="flex-1"></span>
        <button class="btn-ghost text-xs" (click)="toggleFullscreen()" [title]="fullscreen() ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'">
          @if (fullscreen()) { ⤢ Exit fullscreen } @else { ⤡ Fullscreen }
        </button>
        <button class="btn-secondary text-xs" (click)="reset()">↻ Reset</button>
        <button class="btn-secondary text-xs" (click)="downloadJson()">⬇ JSON</button>
        <label class="btn-secondary text-xs cursor-pointer">
          ⬆ Import
          <input type="file" accept="application/json" class="hidden" (change)="importJson($event)" />
        </label>
        <button class="btn-primary text-sm" (click)="print()">⬇ Download PDF</button>
      </div>

      <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 resume-content">

        <!-- LEFT: Editor / Customize / AI -->
        <div class="no-print space-y-3 resume-panel">

          @if (tab() === 'customize') {
            <!-- TEMPLATE -->
            <div class="card p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="text-xs font-bold uppercase tracking-widest text-slate-500">Template</div>
                <span class="text-[10px] text-slate-400">{{ templates.length }} available</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                @for (t of templates; track t.id) {
                  <button class="relative p-3 rounded-lg border text-left transition"
                          [class.border-brand-500]="resume().template === t.id"
                          [class.bg-brand-50]="resume().template === t.id"
                          [class.dark:bg-brand-950]="resume().template === t.id"
                          [class.border-slate-200]="resume().template !== t.id"
                          [class.dark:border-slate-700]="resume().template !== t.id"
                          (click)="setField('template', t.id)">
                    <div class="text-sm font-semibold">{{ t.name }}</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">{{ t.subtitle }}</div>
                    <div class="flex flex-wrap gap-1 mt-1">
                      @for (tag of t.tags; track tag) {
                        <span class="px-1.5 py-0 text-[9px] bg-slate-100 dark:bg-slate-800 rounded font-medium">{{ tag }}</span>
                      }
                    </div>
                    @if (resume().template === t.id) {
                      <div class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[10px] grid place-items-center">✓</div>
                    }
                  </button>
                }
              </div>
            </div>

            <!-- COLOR -->
            <div class="card p-4">
              <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Accent color</div>
              <div class="flex flex-wrap items-center gap-2">
                @for (c of colors; track c) {
                  <button class="w-8 h-8 rounded-full shadow-sm ring-2 transition"
                          [style.background-color]="c"
                          [class.ring-slate-900]="resume().color === c"
                          [class.dark:ring-white]="resume().color === c"
                          [class.ring-transparent]="resume().color !== c"
                          (click)="setField('color', c)">
                  </button>
                }
                <label class="relative w-8 h-8 rounded-full shadow-sm grid place-items-center cursor-pointer overflow-hidden border border-slate-200 dark:border-slate-700">
                  <input type="color" class="absolute inset-0 opacity-0 cursor-pointer" [value]="resume().color" (input)="setField('color', $any($event.target).value)" />
                  <span class="text-lg leading-none">+</span>
                </label>
                <span class="ml-2 text-xs font-mono text-slate-500">{{ resume().color }}</span>
              </div>
            </div>

            <!-- TYPOGRAPHY -->
            <div class="card p-4">
              <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Typography</div>
              <div class="grid grid-cols-3 gap-2">
                <button class="px-3 py-2 rounded-lg text-sm border" style="font-family: ui-sans-serif, system-ui;" [class.border-brand-500]="resume().font === 'sans'" [class.bg-brand-50]="resume().font === 'sans'" [class.border-slate-200]="resume().font !== 'sans'" (click)="setField('font', 'sans')">Sans</button>
                <button class="px-3 py-2 rounded-lg text-sm border" style="font-family: 'Times New Roman', Georgia, serif;" [class.border-brand-500]="resume().font === 'serif'" [class.bg-brand-50]="resume().font === 'serif'" [class.border-slate-200]="resume().font !== 'serif'" (click)="setField('font', 'serif')">Serif</button>
                <button class="px-3 py-2 rounded-lg text-sm border" style="font-family: ui-monospace, monospace;" [class.border-brand-500]="resume().font === 'mono'" [class.bg-brand-50]="resume().font === 'mono'" [class.border-slate-200]="resume().font !== 'mono'" (click)="setField('font', 'mono')">Mono</button>
              </div>
              <div class="mt-3">
                <label class="text-xs flex items-center justify-between">Font size <span class="font-bold">{{ resume().fontSize }}pt</span></label>
                <input type="range" class="w-full mt-1" min="8" max="14" step="0.5" [ngModel]="resume().fontSize" (ngModelChange)="setField('fontSize', $event)" />
              </div>
            </div>

            <!-- LAYOUT -->
            <div class="card p-4">
              <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Layout density</div>
              <div class="grid grid-cols-3 gap-2">
                <button class="px-3 py-2 rounded-lg text-xs border" [class.border-brand-500]="resume().density === 'compact'" [class.bg-brand-50]="resume().density === 'compact'" [class.border-slate-200]="resume().density !== 'compact'" (click)="setField('density', 'compact')">Compact</button>
                <button class="px-3 py-2 rounded-lg text-xs border" [class.border-brand-500]="resume().density === 'normal'" [class.bg-brand-50]="resume().density === 'normal'" [class.border-slate-200]="resume().density !== 'normal'" (click)="setField('density', 'normal')">Normal</button>
                <button class="px-3 py-2 rounded-lg text-xs border" [class.border-brand-500]="resume().density === 'spacious'" [class.bg-brand-50]="resume().density === 'spacious'" [class.border-slate-200]="resume().density !== 'spacious'" (click)="setField('density', 'spacious')">Spacious</button>
              </div>
              <label class="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" [ngModel]="resume().showPhoto" (ngModelChange)="setField('showPhoto', $event)" />
                Show photo (templates that support it)
              </label>
            </div>

            <!-- SAVED PRESETS -->
            <div class="card p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="text-xs font-bold uppercase tracking-widest text-slate-500">My saved styles</div>
                <button class="btn-primary text-xs" (click)="savePreset()">+ Save current</button>
              </div>
              @if (presets().length === 0) {
                <p class="text-xs text-slate-500">No saved styles yet. Customize template/color/font then save to reuse later.</p>
              } @else {
                <div class="space-y-1.5">
                  @for (p of presets(); track p.id) {
                    <div class="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div class="w-5 h-5 rounded-full shrink-0" [style.background-color]="p.color"></div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium truncate">{{ p.name }}</div>
                        <div class="text-[10px] text-slate-500">{{ p.template }} · {{ p.font }} · {{ p.fontSize }}pt · {{ p.density }}</div>
                      </div>
                      <button class="btn-ghost text-xs" (click)="applyPreset(p)">Apply</button>
                      <button class="btn-ghost text-xs text-rose-500" (click)="removePreset(p.id)">✕</button>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- SECTION ORDER -->
            <div class="card p-4">
              <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Section order</div>
              <div class="space-y-1.5">
                @for (key of resume().order; track key; let i = $index) {
                  <div class="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span class="text-sm capitalize">{{ key }}</span>
                    <div class="flex gap-1">
                      <button class="btn-ghost text-xs" [disabled]="i === 0" (click)="moveSection(i, -1)">↑</button>
                      <button class="btn-ghost text-xs" [disabled]="i === resume().order.length - 1" (click)="moveSection(i, 1)">↓</button>
                    </div>
                  </div>
                }
              </div>
            </div>

          } @else if (tab() === 'ai') {

            <!-- AI SETTINGS -->
            <div class="card p-4">
              <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">AI provider</div>
              <select class="input text-sm" [ngModel]="aiSettings().provider" (ngModelChange)="setProvider($event)">
                <option value="free">Free (no key needed)</option>
                <option value="gemini">Google Gemini (BYOK)</option>
                <option value="groq">Groq (BYOK)</option>
                <option value="openai">OpenAI (BYOK)</option>
                <option value="anthropic">Anthropic (BYOK)</option>
              </select>
              @if (aiSettings().provider !== 'free') {
                <input class="input mt-2 text-sm font-mono" type="password" placeholder="API key" [ngModel]="aiSettings().apiKey" (ngModelChange)="setKey($event)" />
                <p class="text-[10px] text-slate-500 mt-1">Key stored locally only. Used directly from your browser.</p>
              }
            </div>

            <!-- AI: IMPROVE SUMMARY -->
            <div class="card p-4">
              <div class="flex items-center justify-between mb-2">
                <div class="text-sm font-bold">📝 Improve summary</div>
                <button class="btn-primary text-xs" (click)="aiImproveSummary()" [disabled]="aiBusy()">
                  @if (aiBusy() === 'summary') { … } @else { ✨ Rewrite }
                </button>
              </div>
              <p class="text-[11px] text-slate-500">Tightens phrasing, adds quantified impact and action verbs. Replaces the current summary.</p>
            </div>

            <!-- AI: GENERATE BULLETS -->
            <div class="card p-4">
              <div class="text-sm font-bold mb-2">⚡ Generate bullets for a role</div>
              <select class="input text-sm" [(ngModel)]="aiTargetRole">
                <option value="">— Pick an experience entry —</option>
                @for (e of resume().experience; track e.id) {
                  <option [value]="e.id">{{ e.title || 'Untitled' }} @ {{ e.company || '—' }}</option>
                }
              </select>
              <button class="btn-secondary text-xs mt-2 w-full" (click)="aiGenerateBullets()" [disabled]="aiBusy() || !aiTargetRole">
                @if (aiBusy() === 'bullets') { Generating… } @else { ✨ Suggest 4 high-impact bullets }
              </button>
              <p class="text-[11px] text-slate-500 mt-1.5">Appends new bullets to the chosen role; you can edit or delete.</p>
            </div>

            <!-- AI: IMPROVE A BULLET -->
            <div class="card p-4">
              <div class="text-sm font-bold mb-2">🎯 Improve one bullet</div>
              <textarea class="input text-sm" rows="3" [(ngModel)]="aiBulletInput" placeholder="Paste a weak bullet — we'll sharpen it."></textarea>
              <button class="btn-secondary text-xs mt-2 w-full" (click)="aiImproveBullet()" [disabled]="aiBusy() || !aiBulletInput.trim()">
                @if (aiBusy() === 'improve-bullet') { Improving… } @else { ✨ Improve }
              </button>
              @if (aiBulletOutput()) {
                <div class="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                  <div class="text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300 mb-1">Suggestion</div>
                  <div class="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{{ aiBulletOutput() }}</div>
                  <button class="btn-ghost text-xs mt-1" (click)="copy(aiBulletOutput())">Copy</button>
                </div>
              }
            </div>

            <!-- AI: TAILOR TO JOB DESCRIPTION -->
            <div class="card p-4">
              <div class="text-sm font-bold mb-2">🎯 Tailor to a job description</div>
              <textarea class="input text-sm font-mono" rows="6" [(ngModel)]="aiJobDescription" placeholder="Paste the job description here…"></textarea>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <button class="btn-secondary text-xs" (click)="aiAtsAnalyze()" [disabled]="aiBusy() || !aiJobDescription.trim()">
                  @if (aiBusy() === 'ats') { Analyzing… } @else { 📊 ATS keyword check }
                </button>
                <button class="btn-primary text-xs" (click)="aiTailorAdvice()" [disabled]="aiBusy() || !aiJobDescription.trim()">
                  @if (aiBusy() === 'tailor') { Thinking… } @else { ✨ Tailor advice }
                </button>
              </div>
              @if (atsReport()) {
                <div class="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div class="flex items-center justify-between">
                    <div class="text-xs font-bold uppercase tracking-widest text-slate-500">Keyword match</div>
                    <div class="text-base font-bold" [style.color]="atsReport()!.score >= 75 ? '#059669' : atsReport()!.score >= 50 ? '#d97706' : '#dc2626'">{{ atsReport()!.score }}%</div>
                  </div>
                  <div class="h-2 mt-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div class="h-full" [style.width.%]="atsReport()!.score" [style.background-color]="atsReport()!.score >= 75 ? '#10b981' : atsReport()!.score >= 50 ? '#f59e0b' : '#ef4444'"></div>
                  </div>
                  @if (atsReport()!.matched.length) {
                    <div class="mt-2">
                      <div class="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Found in your resume ({{ atsReport()!.matched.length }})</div>
                      <div class="flex flex-wrap gap-1">
                        @for (k of atsReport()!.matched; track k) {
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">{{ k }}</span>
                        }
                      </div>
                    </div>
                  }
                  @if (atsReport()!.missing.length) {
                    <div class="mt-2">
                      <div class="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1">Missing ({{ atsReport()!.missing.length }})</div>
                      <div class="flex flex-wrap gap-1">
                        @for (k of atsReport()!.missing; track k) {
                          <span class="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">{{ k }}</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
              @if (aiTailorOutput()) {
                <div class="mt-2 p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900/50">
                  <div class="text-[10px] font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300 mb-1">AI advice</div>
                  <div class="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{{ aiTailorOutput() }}</div>
                </div>
              }
            </div>

            <!-- AI: EXTRACT SKILLS -->
            <div class="card p-4">
              <div class="text-sm font-bold mb-2">🧠 Extract skills from experience</div>
              <button class="btn-secondary text-xs w-full" (click)="aiExtractSkills()" [disabled]="aiBusy()">
                @if (aiBusy() === 'skills') { Working… } @else { ✨ Suggest skills }
              </button>
              <p class="text-[11px] text-slate-500 mt-1.5">Reads your experience bullets and adds skill suggestions to the skills section.</p>
            </div>

            <!-- AI: COVER LETTER -->
            <div class="card p-4">
              <div class="text-sm font-bold mb-2">✉ Draft cover letter</div>
              <input class="input text-sm" [(ngModel)]="aiCoverCompany" placeholder="Company name" />
              <input class="input text-sm mt-2" [(ngModel)]="aiCoverRole" placeholder="Role you're applying to" />
              <button class="btn-primary text-xs mt-2 w-full" (click)="aiCoverLetter()" [disabled]="aiBusy() || !aiCoverCompany.trim() || !aiCoverRole.trim()">
                @if (aiBusy() === 'cover') { Writing… } @else { ✨ Generate cover letter }
              </button>
              @if (aiCoverOutput()) {
                <div class="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div class="flex items-center justify-between mb-1">
                    <div class="text-[10px] font-bold uppercase tracking-widest text-slate-500">Draft</div>
                    <button class="btn-ghost text-xs" (click)="copy(aiCoverOutput())">Copy</button>
                  </div>
                  <div class="text-xs whitespace-pre-wrap leading-relaxed">{{ aiCoverOutput() }}</div>
                </div>
              }
            </div>

          } @else {

            <!-- PERSONAL -->
            <details open class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">👤 Personal details</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </summary>
              <div class="mt-3 grid grid-cols-2 gap-2">
                <input class="input col-span-2" placeholder="Full name" [ngModel]="resume().personal.name" (ngModelChange)="updatePersonal('name', $event)" />
                <input class="input col-span-2" placeholder="Job title" [ngModel]="resume().personal.title" (ngModelChange)="updatePersonal('title', $event)" />
                <input class="input" placeholder="Email" [ngModel]="resume().personal.email" (ngModelChange)="updatePersonal('email', $event)" />
                <input class="input" placeholder="Phone" [ngModel]="resume().personal.phone" (ngModelChange)="updatePersonal('phone', $event)" />
                <input class="input" placeholder="Location" [ngModel]="resume().personal.location" (ngModelChange)="updatePersonal('location', $event)" />
                <input class="input" placeholder="Website" [ngModel]="resume().personal.website" (ngModelChange)="updatePersonal('website', $event)" />
                <input class="input col-span-2" placeholder="LinkedIn" [ngModel]="resume().personal.linkedin" (ngModelChange)="updatePersonal('linkedin', $event)" />
                <div class="col-span-2 flex items-center gap-2">
                  @if (resume().personal.photo) {
                    <img [src]="resume().personal.photo" class="w-12 h-12 rounded-full object-cover" />
                    <button class="btn-ghost text-xs text-rose-500" (click)="updatePersonal('photo', '')">Remove photo</button>
                  } @else {
                    <label class="btn-secondary text-xs cursor-pointer">
                      📷 Upload photo
                      <input type="file" accept="image/*" class="hidden" (change)="onPhotoUpload($event)" />
                    </label>
                  }
                </div>
              </div>
            </details>

            <!-- SUMMARY -->
            <details open class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">📝 Professional summary</span>
                <span class="text-[10px] text-slate-400">{{ wordCount(resume().personal.summary) }} words</span>
              </summary>
              <textarea class="input mt-3 text-sm" rows="5" placeholder="2-3 sentences positioning you for the target role" [ngModel]="resume().personal.summary" (ngModelChange)="updatePersonal('summary', $event)"></textarea>
              <div class="flex gap-2 mt-2">
                <button class="btn-ghost text-xs" (click)="aiImproveSummary()" [disabled]="aiBusy()">✨ AI improve</button>
                <button class="btn-ghost text-xs" (click)="aiGenerateSummary()" [disabled]="aiBusy()">✨ Generate from experience</button>
              </div>
            </details>

            <!-- EXPERIENCE -->
            <details open class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">💼 Experience</span>
                <span class="text-[10px] text-slate-400">{{ resume().experience.length }}</span>
              </summary>
              <div class="mt-3 space-y-3">
                @for (exp of resume().experience; track exp.id; let i = $index) {
                  <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <div class="flex justify-between gap-2 items-center">
                      <input class="input text-sm flex-1" placeholder="Job title" [ngModel]="exp.title" (ngModelChange)="updateItem('experience', i, 'title', $event)" />
                      <button class="btn-ghost text-xs" [disabled]="i === 0" (click)="moveItem('experience', i, -1)" title="Move up">↑</button>
                      <button class="btn-ghost text-xs" [disabled]="i === resume().experience.length - 1" (click)="moveItem('experience', i, 1)" title="Move down">↓</button>
                      <button class="btn-ghost text-rose-500 text-xs" (click)="removeItem('experience', i)">✕</button>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                      <input class="input text-sm" placeholder="Company" [ngModel]="exp.company" (ngModelChange)="updateItem('experience', i, 'company', $event)" />
                      <input class="input text-sm" placeholder="Location" [ngModel]="exp.location" (ngModelChange)="updateItem('experience', i, 'location', $event)" />
                      <input class="input text-sm" placeholder="Start (e.g. Jan 2022)" [ngModel]="exp.start" (ngModelChange)="updateItem('experience', i, 'start', $event)" />
                      <input class="input text-sm" placeholder="End (or Present)" [ngModel]="exp.end" (ngModelChange)="updateItem('experience', i, 'end', $event)" [disabled]="exp.current" />
                    </div>
                    <label class="flex items-center gap-2 text-xs">
                      <input type="checkbox" [ngModel]="exp.current" (ngModelChange)="onCurrentToggle(i, $event)" />
                      Currently work here
                    </label>
                    <textarea class="input text-sm" rows="4" placeholder="One bullet per line — describe impact with numbers" [ngModel]="exp.bullets" (ngModelChange)="updateItem('experience', i, 'bullets', $event)"></textarea>
                    <div class="flex flex-wrap gap-1">
                      <button class="btn-ghost text-[11px]" (click)="aiImproveAllBullets(i)" [disabled]="aiBusy()">✨ Improve all bullets</button>
                      <button class="btn-ghost text-[11px]" (click)="aiAddBulletsForJob(i)" [disabled]="aiBusy()">✨ Add bullets</button>
                    </div>
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addExperience()">+ Add experience</button>
              </div>
            </details>

            <!-- EDUCATION -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">🎓 Education</span>
                <span class="text-[10px] text-slate-400">{{ resume().education.length }}</span>
              </summary>
              <div class="mt-3 space-y-3">
                @for (ed of resume().education; track ed.id; let i = $index) {
                  <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <div class="flex justify-between gap-2 items-center">
                      <input class="input text-sm flex-1" placeholder="Degree" [ngModel]="ed.degree" (ngModelChange)="updateItem('education', i, 'degree', $event)" />
                      <button class="btn-ghost text-xs" [disabled]="i === 0" (click)="moveItem('education', i, -1)">↑</button>
                      <button class="btn-ghost text-xs" [disabled]="i === resume().education.length - 1" (click)="moveItem('education', i, 1)">↓</button>
                      <button class="btn-ghost text-rose-500 text-xs" (click)="removeItem('education', i)">✕</button>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5">
                      <input class="input text-sm" placeholder="School" [ngModel]="ed.school" (ngModelChange)="updateItem('education', i, 'school', $event)" />
                      <input class="input text-sm" placeholder="Location" [ngModel]="ed.location" (ngModelChange)="updateItem('education', i, 'location', $event)" />
                      <input class="input text-sm" placeholder="Start" [ngModel]="ed.start" (ngModelChange)="updateItem('education', i, 'start', $event)" />
                      <input class="input text-sm" placeholder="End" [ngModel]="ed.end" (ngModelChange)="updateItem('education', i, 'end', $event)" />
                    </div>
                    <textarea class="input text-sm" rows="2" placeholder="Honors, GPA, relevant coursework (optional)" [ngModel]="ed.description" (ngModelChange)="updateItem('education', i, 'description', $event)"></textarea>
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addEducation()">+ Add education</button>
              </div>
            </details>

            <!-- SKILLS -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">⚡ Skills</span>
                <span class="text-[10px] text-slate-400">{{ resume().skills.length }}</span>
              </summary>
              <div class="mt-3 space-y-1.5">
                @for (s of resume().skills; track s.id; let i = $index) {
                  <div class="flex items-center gap-1.5">
                    <input class="input text-sm flex-1" placeholder="Skill name" [ngModel]="s.name" (ngModelChange)="updateItem('skills', i, 'name', $event)" />
                    <input type="range" min="1" max="5" class="w-20" [ngModel]="s.level" (ngModelChange)="updateItem('skills', i, 'level', +$event)" />
                    <span class="text-xs w-4">{{ s.level }}</span>
                    <button class="btn-ghost text-xs" [disabled]="i === 0" (click)="moveItem('skills', i, -1)">↑</button>
                    <button class="btn-ghost text-xs" [disabled]="i === resume().skills.length - 1" (click)="moveItem('skills', i, 1)">↓</button>
                    <button class="btn-ghost text-rose-500 text-xs" (click)="removeItem('skills', i)">✕</button>
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addSkill()">+ Add skill</button>
                <button class="btn-ghost text-xs w-full" (click)="aiExtractSkills()" [disabled]="aiBusy()">✨ AI suggest skills</button>
              </div>
            </details>

            <!-- PROJECTS -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">🚀 Projects</span>
                <span class="text-[10px] text-slate-400">{{ resume().projects.length }}</span>
              </summary>
              <div class="mt-3 space-y-3">
                @for (p of resume().projects; track p.id; let i = $index) {
                  <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <div class="flex justify-between gap-2 items-center">
                      <input class="input text-sm flex-1" placeholder="Project name" [ngModel]="p.name" (ngModelChange)="updateItem('projects', i, 'name', $event)" />
                      <button class="btn-ghost text-xs" [disabled]="i === 0" (click)="moveItem('projects', i, -1)">↑</button>
                      <button class="btn-ghost text-xs" [disabled]="i === resume().projects.length - 1" (click)="moveItem('projects', i, 1)">↓</button>
                      <button class="btn-ghost text-rose-500 text-xs" (click)="removeItem('projects', i)">✕</button>
                    </div>
                    <input class="input text-sm" placeholder="URL" [ngModel]="p.url" (ngModelChange)="updateItem('projects', i, 'url', $event)" />
                    <input class="input text-sm" placeholder="Tech stack" [ngModel]="p.tech" (ngModelChange)="updateItem('projects', i, 'tech', $event)" />
                    <textarea class="input text-sm" rows="2" placeholder="One-line description" [ngModel]="p.description" (ngModelChange)="updateItem('projects', i, 'description', $event)"></textarea>
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addProject()">+ Add project</button>
              </div>
            </details>

            <!-- LANGUAGES -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">🌐 Languages</span>
                <span class="text-[10px] text-slate-400">{{ resume().languages.length }}</span>
              </summary>
              <div class="mt-3 space-y-1.5">
                @for (l of resume().languages; track l.id; let i = $index) {
                  <div class="flex items-center gap-1.5">
                    <input class="input text-sm flex-1" placeholder="Language" [ngModel]="l.name" (ngModelChange)="updateItem('languages', i, 'name', $event)" />
                    <select class="input text-sm w-40" [ngModel]="l.level" (ngModelChange)="updateItem('languages', i, 'level', $event)">
                      <option>Native</option><option>Fluent</option><option>Advanced</option><option>Intermediate</option><option>Basic</option>
                    </select>
                    <button class="btn-ghost text-rose-500 text-xs" (click)="removeItem('languages', i)">✕</button>
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addLanguage()">+ Add language</button>
              </div>
            </details>

            <!-- CERTIFICATIONS -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">🏆 Certifications</span>
                <span class="text-[10px] text-slate-400">{{ resume().certifications.length }}</span>
              </summary>
              <div class="mt-3 space-y-1.5">
                @for (c of resume().certifications; track c.id; let i = $index) {
                  <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 grid grid-cols-[1fr_auto] gap-1.5">
                    <input class="input text-sm" placeholder="Certificate name" [ngModel]="c.name" (ngModelChange)="updateItem('certifications', i, 'name', $event)" />
                    <button class="btn-ghost text-rose-500 text-xs" (click)="removeItem('certifications', i)">✕</button>
                    <input class="input text-sm" placeholder="Issuer" [ngModel]="c.issuer" (ngModelChange)="updateItem('certifications', i, 'issuer', $event)" />
                    <input class="input text-sm w-20" placeholder="Year" [ngModel]="c.date" (ngModelChange)="updateItem('certifications', i, 'date', $event)" />
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addCertification()">+ Add certification</button>
              </div>
            </details>

            <!-- AWARDS -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">🥇 Awards</span>
                <span class="text-[10px] text-slate-400">{{ resume().awards.length }}</span>
              </summary>
              <div class="mt-3 space-y-1.5">
                @for (a of resume().awards; track a.id; let i = $index) {
                  <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 grid grid-cols-[1fr_auto] gap-1.5">
                    <input class="input text-sm" placeholder="Award name" [ngModel]="a.name" (ngModelChange)="updateItem('awards', i, 'name', $event)" />
                    <button class="btn-ghost text-rose-500 text-xs" (click)="removeItem('awards', i)">✕</button>
                    <input class="input text-sm" placeholder="Issuer" [ngModel]="a.issuer" (ngModelChange)="updateItem('awards', i, 'issuer', $event)" />
                    <input class="input text-sm w-20" placeholder="Year" [ngModel]="a.date" (ngModelChange)="updateItem('awards', i, 'date', $event)" />
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addAward()">+ Add award</button>
              </div>
            </details>

            <!-- VOLUNTEER -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">🤝 Volunteer</span>
                <span class="text-[10px] text-slate-400">{{ resume().volunteer.length }}</span>
              </summary>
              <div class="mt-3 space-y-3">
                @for (v of resume().volunteer; track v.id; let i = $index) {
                  <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-1.5">
                    <div class="flex justify-between gap-2 items-center">
                      <input class="input text-sm flex-1" placeholder="Role" [ngModel]="v.role" (ngModelChange)="updateItem('volunteer', i, 'role', $event)" />
                      <button class="btn-ghost text-rose-500 text-xs" (click)="removeItem('volunteer', i)">✕</button>
                    </div>
                    <input class="input text-sm" placeholder="Organization" [ngModel]="v.organization" (ngModelChange)="updateItem('volunteer', i, 'organization', $event)" />
                    <div class="grid grid-cols-2 gap-1.5">
                      <input class="input text-sm" placeholder="Start" [ngModel]="v.start" (ngModelChange)="updateItem('volunteer', i, 'start', $event)" />
                      <input class="input text-sm" placeholder="End" [ngModel]="v.end" (ngModelChange)="updateItem('volunteer', i, 'end', $event)" />
                    </div>
                    <textarea class="input text-sm" rows="2" placeholder="Description" [ngModel]="v.description" (ngModelChange)="updateItem('volunteer', i, 'description', $event)"></textarea>
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addVolunteer()">+ Add volunteer</button>
              </div>
            </details>

            <!-- INTERESTS -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">🎨 Interests</span>
              </summary>
              <input class="input text-sm mt-3" placeholder="Comma-separated (Travel, Chess, Climbing)" [ngModel]="resume().interests" (ngModelChange)="setField('interests', $event)" />
            </details>

            <!-- CUSTOM SECTIONS -->
            <details class="card p-4">
              <summary class="cursor-pointer flex items-center justify-between">
                <span class="text-sm font-bold">✨ Custom sections</span>
                <span class="text-[10px] text-slate-400">{{ resume().customSections.length }}</span>
              </summary>
              <div class="mt-3 space-y-3">
                @for (cs of resume().customSections; track cs.id; let i = $index) {
                  <div class="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    <div class="flex justify-between gap-2 items-center">
                      <input class="input text-sm flex-1 font-semibold" placeholder="Section title" [ngModel]="cs.title" (ngModelChange)="updateCustomTitle(i, $event)" />
                      <button class="btn-ghost text-rose-500 text-xs" (click)="removeCustomSection(i)">✕</button>
                    </div>
                    @for (it of cs.items; track it.id; let j = $index) {
                      <div class="p-2 rounded bg-white dark:bg-slate-900 space-y-1">
                        <input class="input text-sm" placeholder="Heading" [ngModel]="it.line1" (ngModelChange)="updateCustomItem(i, j, 'line1', $event)" />
                        <input class="input text-sm" placeholder="Subheading (optional)" [ngModel]="it.line2" (ngModelChange)="updateCustomItem(i, j, 'line2', $event)" />
                        <textarea class="input text-sm" rows="2" placeholder="Description" [ngModel]="it.description" (ngModelChange)="updateCustomItem(i, j, 'description', $event)"></textarea>
                        <button class="btn-ghost text-rose-500 text-[11px]" (click)="removeCustomItem(i, j)">Remove item</button>
                      </div>
                    }
                    <button class="btn-ghost text-xs w-full" (click)="addCustomItem(i)">+ Add item</button>
                  </div>
                }
                <button class="btn-secondary text-xs w-full" (click)="addCustomSection()">+ New custom section</button>
              </div>
            </details>
          }
        </div>

        <!-- RIGHT: Preview -->
        <div class="resume-preview-wrap">
          <div id="resume-page-root" class="resume-page mx-auto shadow-lg"
               [class]="'tpl-' + resume().template + ' font-' + resume().font + ' density-' + resume().density"
               [style.--accent]="resume().color"
               [style.font-size.pt]="resume().fontSize">
            <ng-container *ngTemplateOutlet="tplRoot"></ng-container>
          </div>
        </div>
      </div>
    </section>

    <ng-template #tplRoot>
      @switch (resume().template) {
        @case ('professional') { <ng-container *ngTemplateOutlet="tplProfessional"></ng-container> }
        @case ('two-column')   { <ng-container *ngTemplateOutlet="tplTwoColumn"></ng-container> }
        @case ('modern')       { <ng-container *ngTemplateOutlet="tplModern"></ng-container> }
        @case ('ats')          { <ng-container *ngTemplateOutlet="tplAts"></ng-container> }
        @case ('minimal')      { <ng-container *ngTemplateOutlet="tplMinimal"></ng-container> }
        @case ('executive')    { <ng-container *ngTemplateOutlet="tplExecutive"></ng-container> }
        @case ('creative')     { <ng-container *ngTemplateOutlet="tplCreative"></ng-container> }
        @case ('designer')     { <ng-container *ngTemplateOutlet="tplDesigner"></ng-container> }
        @case ('tech')         { <ng-container *ngTemplateOutlet="tplTech"></ng-container> }
        @default               { <ng-container *ngTemplateOutlet="tplClassic"></ng-container> }
      }
    </ng-template>

    <ng-template #tplClassic>
      <header class="text-center pb-3 border-b-2" [style.border-color]="resume().color">
        <h1 class="text-3xl font-bold tracking-wide" [style.color]="resume().color">{{ resume().personal.name }}</h1>
        <div class="text-sm mt-1 text-slate-600">{{ resume().personal.title }}</div>
        <div class="text-xs mt-2 text-slate-600">{{ contactLine() }}</div>
      </header>
      <main class="pt-3"><ng-container *ngTemplateOutlet="sections"></ng-container></main>
    </ng-template>

    <ng-template #tplModern>
      <header class="pb-4 mb-4 border-b-4" [style.border-color]="resume().color">
        <h1 class="text-4xl font-extrabold tracking-tight">{{ resume().personal.name }}</h1>
        <div class="text-base mt-1 font-semibold" [style.color]="resume().color">{{ resume().personal.title }}</div>
        <div class="text-xs mt-2 text-slate-600 flex flex-wrap gap-x-4 gap-y-0.5">
          @if (resume().personal.email) { <span>✉ {{ resume().personal.email }}</span> }
          @if (resume().personal.phone) { <span>☏ {{ resume().personal.phone }}</span> }
          @if (resume().personal.location) { <span>⌖ {{ resume().personal.location }}</span> }
          @if (resume().personal.website) { <span>↗ {{ resume().personal.website }}</span> }
          @if (resume().personal.linkedin) { <span>in {{ resume().personal.linkedin }}</span> }
        </div>
      </header>
      <main><ng-container *ngTemplateOutlet="sections"></ng-container></main>
    </ng-template>

    <ng-template #tplTwoColumn>
      <div class="grid grid-cols-[1fr_36%] gap-5 h-full">
        <div>
          <h1 class="text-3xl font-bold leading-tight">{{ resume().personal.name }}</h1>
          <div class="text-sm text-slate-600 mb-3">{{ resume().personal.title }}</div>
          <ng-container *ngTemplateOutlet="sectionsMain"></ng-container>
        </div>
        <aside class="p-4 -mr-[18mm] -my-[18mm] pt-6" [style.background-color]="resume().color + '0d'" [style.border-left]="'4px solid ' + resume().color">
          @if (resume().showPhoto && resume().personal.photo) {
            <img [src]="resume().personal.photo" class="w-24 h-24 rounded-full object-cover mb-3 mx-auto" />
          }
          <ng-container *ngTemplateOutlet="sectionsAside"></ng-container>
        </aside>
      </div>
    </ng-template>

    <ng-template #tplProfessional>
      <div class="grid grid-cols-[36%_1fr] gap-0 h-full -m-[18mm]">
        <aside class="p-6 text-white" [style.background-color]="resume().color">
          @if (resume().showPhoto && resume().personal.photo) {
            <img [src]="resume().personal.photo" class="w-28 h-28 rounded-full object-cover mb-4 ring-4 ring-white/20" />
          }
          <h1 class="text-2xl font-bold leading-tight">{{ resume().personal.name }}</h1>
          <div class="text-xs uppercase tracking-widest mt-1 opacity-90">{{ resume().personal.title }}</div>

          <div class="mt-5">
            <div class="text-xs font-bold uppercase tracking-widest mb-1 opacity-75">Details</div>
            <div class="text-xs space-y-0.5">
              @if (resume().personal.location) { <div>{{ resume().personal.location }}</div> }
              @if (resume().personal.phone) { <div>{{ resume().personal.phone }}</div> }
              @if (resume().personal.email) { <div>{{ resume().personal.email }}</div> }
              @if (resume().personal.website) { <div>{{ resume().personal.website }}</div> }
              @if (resume().personal.linkedin) { <div>{{ resume().personal.linkedin }}</div> }
            </div>
          </div>

          @if (resume().skills.length) {
            <div class="mt-5">
              <div class="text-xs font-bold uppercase tracking-widest mb-1 opacity-75">Skills</div>
              @for (s of resume().skills; track s.id) {
                <div class="text-xs mb-1.5">
                  <div>{{ s.name }}</div>
                  <div class="h-1 mt-0.5 bg-white/20 rounded-full overflow-hidden"><div class="h-full bg-white/80" [style.width.%]="s.level * 20"></div></div>
                </div>
              }
            </div>
          }

          @if (resume().languages.length) {
            <div class="mt-5">
              <div class="text-xs font-bold uppercase tracking-widest mb-1 opacity-75">Languages</div>
              @for (l of resume().languages; track l.id) {
                <div class="text-xs flex justify-between"><span>{{ l.name }}</span><span class="opacity-75">{{ l.level }}</span></div>
              }
            </div>
          }

          @if (resume().interests) {
            <div class="mt-5">
              <div class="text-xs font-bold uppercase tracking-widest mb-1 opacity-75">Interests</div>
              <div class="text-xs">{{ resume().interests }}</div>
            </div>
          }
        </aside>

        <main class="p-6">
          @if (resume().personal.summary) {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase tracking-widest mb-1" [style.color]="resume().color">Profile</h2>
              <p class="text-xs leading-relaxed text-slate-700">{{ resume().personal.summary }}</p>
            </section>
          }
          @if (resume().experience.length) {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase tracking-widest mb-2" [style.color]="resume().color">Employment History</h2>
              @for (e of resume().experience; track e.id) {
                <div class="mb-3">
                  <div class="font-semibold text-xs">{{ e.title }} <span class="text-slate-500 font-normal">— {{ e.company }}</span></div>
                  <div class="text-[11px] text-slate-500">{{ e.start }} — {{ e.end || 'Present' }} · {{ e.location }}</div>
                  <ul class="list-disc pl-4 mt-1 space-y-0.5 text-xs text-slate-700">
                    @for (b of bulletsOf(e.bullets); track $index) { <li>{{ b }}</li> }
                  </ul>
                </div>
              }
            </section>
          }
          @if (resume().education.length) {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase tracking-widest mb-2" [style.color]="resume().color">Education</h2>
              @for (e of resume().education; track e.id) {
                <div class="mb-2 text-xs">
                  <div class="font-semibold">{{ e.degree }}</div>
                  <div class="text-slate-600">{{ e.school }} · {{ e.start }} — {{ e.end }}</div>
                  @if (e.description) { <div class="text-slate-600 mt-0.5">{{ e.description }}</div> }
                </div>
              }
            </section>
          }
          @if (resume().projects.length) {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase tracking-widest mb-2" [style.color]="resume().color">Projects</h2>
              @for (p of resume().projects; track p.id) {
                <div class="mb-2 text-xs">
                  <div class="font-semibold">{{ p.name }} <span class="text-slate-500 font-normal">{{ p.url ? ' · ' + p.url : '' }}</span></div>
                  <div class="text-slate-600">{{ p.description }}</div>
                  @if (p.tech) { <div class="text-slate-500 italic">{{ p.tech }}</div> }
                </div>
              }
            </section>
          }
          @if (resume().certifications.length) {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase tracking-widest mb-2" [style.color]="resume().color">Certifications</h2>
              @for (c of resume().certifications; track c.id) {
                <div class="mb-1 text-xs"><span class="font-semibold">{{ c.name }}</span><span class="text-slate-500"> — {{ c.issuer }} · {{ c.date }}</span></div>
              }
            </section>
          }
          @if (resume().awards.length) {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase tracking-widest mb-2" [style.color]="resume().color">Awards</h2>
              @for (a of resume().awards; track a.id) {
                <div class="mb-1 text-xs"><span class="font-semibold">{{ a.name }}</span><span class="text-slate-500"> — {{ a.issuer }} · {{ a.date }}</span></div>
              }
            </section>
          }
          @if (resume().volunteer.length) {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase tracking-widest mb-2" [style.color]="resume().color">Volunteer</h2>
              @for (v of resume().volunteer; track v.id) {
                <div class="mb-2 text-xs">
                  <div class="font-semibold">{{ v.role }} <span class="text-slate-500 font-normal">— {{ v.organization }}</span></div>
                  <div class="text-[11px] text-slate-500">{{ v.start }} — {{ v.end }}</div>
                  @if (v.description) { <div class="text-slate-600 mt-0.5">{{ v.description }}</div> }
                </div>
              }
            </section>
          }
          @for (cs of resume().customSections; track cs.id) {
            <section class="mb-4">
              <h2 class="text-sm font-bold uppercase tracking-widest mb-2" [style.color]="resume().color">{{ cs.title }}</h2>
              @for (it of cs.items; track it.id) {
                <div class="mb-2 text-xs">
                  @if (it.line1) { <div class="font-semibold">{{ it.line1 }}</div> }
                  @if (it.line2) { <div class="text-slate-500 text-[11px]">{{ it.line2 }}</div> }
                  @if (it.description) { <div class="text-slate-600">{{ it.description }}</div> }
                </div>
              }
            </section>
          }
        </main>
      </div>
    </ng-template>

    <ng-template #tplAts>
      <header class="pb-2">
        <h1 class="text-2xl font-bold">{{ resume().personal.name }}</h1>
        <div class="text-sm">{{ resume().personal.title }}</div>
        <div class="text-xs mt-1">{{ contactLine() }}</div>
      </header>
      <main class="pt-2"><ng-container *ngTemplateOutlet="sections"></ng-container></main>
    </ng-template>

    <ng-template #tplMinimal>
      <header class="pb-4 mb-4">
        <h1 class="text-5xl font-extralight tracking-tight">{{ resume().personal.name }}</h1>
        <div class="text-base mt-1 text-slate-600">{{ resume().personal.title }}</div>
        <div class="w-10 h-0.5 mt-3" [style.background-color]="resume().color"></div>
        <div class="text-xs mt-3 text-slate-500">{{ contactLine() }}</div>
      </header>
      <main><ng-container *ngTemplateOutlet="sections"></ng-container></main>
    </ng-template>

    <ng-template #tplExecutive>
      <header class="text-center pb-4 mb-4 border-b border-t py-4" [style.border-color]="resume().color">
        <h1 class="text-4xl font-bold tracking-widest uppercase" [style.color]="resume().color">{{ resume().personal.name }}</h1>
        <div class="text-sm mt-2 italic text-slate-700">{{ resume().personal.title }}</div>
        <div class="text-xs mt-2 text-slate-600">{{ contactLine() }}</div>
      </header>
      <main><ng-container *ngTemplateOutlet="sections"></ng-container></main>
    </ng-template>

    <ng-template #tplCreative>
      <header class="-mx-[18mm] -mt-[18mm] mb-5 p-8 text-white relative overflow-hidden"
              [style.background]="'linear-gradient(135deg, ' + resume().color + ' 0%, ' + adjustColor(resume().color, 30) + ' 100%)'">
        <div class="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10"></div>
        <div class="absolute -right-20 bottom-0 w-60 h-60 rounded-full bg-white/5"></div>
        <div class="relative flex items-center gap-5">
          @if (resume().showPhoto && resume().personal.photo) {
            <img [src]="resume().personal.photo" class="w-24 h-24 rounded-full object-cover ring-4 ring-white/30 shrink-0" />
          }
          <div>
            <h1 class="text-4xl font-extrabold tracking-tight">{{ resume().personal.name }}</h1>
            <div class="text-base mt-1 opacity-90">{{ resume().personal.title }}</div>
            <div class="text-xs mt-2 flex flex-wrap gap-x-3 opacity-85">
              @if (resume().personal.email) { <span>{{ resume().personal.email }}</span> }
              @if (resume().personal.phone) { <span>{{ resume().personal.phone }}</span> }
              @if (resume().personal.location) { <span>{{ resume().personal.location }}</span> }
              @if (resume().personal.linkedin) { <span>{{ resume().personal.linkedin }}</span> }
            </div>
          </div>
        </div>
      </header>
      <main><ng-container *ngTemplateOutlet="sections"></ng-container></main>
    </ng-template>

    <ng-template #tplDesigner>
      <div class="grid grid-cols-[1fr_30%] gap-6">
        <div>
          <h1 class="text-5xl font-bold leading-none mb-1" [style.color]="resume().color">{{ resume().personal.name }}</h1>
          <div class="text-lg mt-1 text-slate-600 mb-4">{{ resume().personal.title }}</div>
          <div class="text-xs text-slate-600 mb-5">{{ contactLine() }}</div>
          <ng-container *ngTemplateOutlet="sections"></ng-container>
        </div>
        @if (resume().showPhoto && resume().personal.photo) {
          <aside>
            <img [src]="resume().personal.photo" class="w-full aspect-square object-cover rounded-2xl shadow-lg" />
            <div class="mt-3 p-3 rounded-xl" [style.background-color]="resume().color + '12'">
              <div class="text-[10px] font-bold uppercase tracking-widest mb-1" [style.color]="resume().color">Contact</div>
              <div class="text-xs space-y-0.5">
                @if (resume().personal.email) { <div>{{ resume().personal.email }}</div> }
                @if (resume().personal.phone) { <div>{{ resume().personal.phone }}</div> }
                @if (resume().personal.location) { <div>{{ resume().personal.location }}</div> }
              </div>
            </div>
          </aside>
        }
      </div>
    </ng-template>

    <ng-template #tplTech>
      <header class="pb-3 mb-3" style="font-family: ui-monospace, 'JetBrains Mono', monospace;">
        <div class="text-xs text-slate-500"># {{ resume().personal.name | lowercase }}.resume</div>
        <h1 class="text-3xl font-bold mt-1">{{ resume().personal.name }}</h1>
        <div class="text-sm text-slate-700 mt-1">// {{ resume().personal.title }}</div>
        <div class="text-xs text-slate-600 mt-2 flex flex-wrap gap-x-3">
          @if (resume().personal.email) { <span [style.color]="resume().color">{{ resume().personal.email }}</span> }
          @if (resume().personal.phone) { <span>{{ resume().personal.phone }}</span> }
          @if (resume().personal.location) { <span>{{ resume().personal.location }}</span> }
          @if (resume().personal.website) { <span [style.color]="resume().color">{{ resume().personal.website }}</span> }
        </div>
      </header>
      <main><ng-container *ngTemplateOutlet="sections"></ng-container></main>
    </ng-template>

    <ng-template #sections>
      @for (key of resume().order; track key) {
        <ng-container *ngTemplateOutlet="sectionTpl; context: { $implicit: key }"></ng-container>
      }
      @for (cs of resume().customSections; track cs.id) {
        <section class="sec">
          <h2 class="sec-h" [style.color]="resume().color">{{ cs.title }}</h2>
          @for (it of cs.items; track it.id) {
            <div class="mb-1.5">
              @if (it.line1) { <div class="font-semibold">{{ it.line1 }}</div> }
              @if (it.line2) { <div class="text-slate-500">{{ it.line2 }}</div> }
              @if (it.description) { <div class="text-slate-700">{{ it.description }}</div> }
            </div>
          }
        </section>
      }
    </ng-template>

    <ng-template #sectionsMain>
      @for (key of mainKeys(); track key) {
        <ng-container *ngTemplateOutlet="sectionTpl; context: { $implicit: key }"></ng-container>
      }
    </ng-template>

    <ng-template #sectionsAside>
      @for (key of asideKeys(); track key) {
        <ng-container *ngTemplateOutlet="sectionTpl; context: { $implicit: key }"></ng-container>
      }
    </ng-template>

    <ng-template #sectionTpl let-key>
      @switch (key) {
        @case ('summary') {
          @if (resume().personal.summary) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Summary</h2>
              <p class="leading-relaxed text-slate-700">{{ resume().personal.summary }}</p>
            </section>
          }
        }
        @case ('experience') {
          @if (resume().experience.length) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Experience</h2>
              @for (e of resume().experience; track e.id) {
                <div class="mb-2">
                  <div class="flex justify-between font-semibold">
                    <span>{{ e.title }} — {{ e.company }}</span>
                    <span class="text-slate-500 font-normal">{{ e.start }} — {{ e.end || 'Present' }}</span>
                  </div>
                  <div class="text-slate-500 text-[0.9em]">{{ e.location }}</div>
                  <ul class="list-disc pl-4 mt-1 space-y-0.5 text-slate-700">
                    @for (b of bulletsOf(e.bullets); track $index) { <li>{{ b }}</li> }
                  </ul>
                </div>
              }
            </section>
          }
        }
        @case ('education') {
          @if (resume().education.length) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Education</h2>
              @for (e of resume().education; track e.id) {
                <div class="mb-1.5">
                  <div class="flex justify-between font-semibold"><span>{{ e.degree }}</span><span class="text-slate-500 font-normal">{{ e.start }} — {{ e.end }}</span></div>
                  <div class="text-slate-600">{{ e.school }}{{ e.location ? ' · ' + e.location : '' }}</div>
                  @if (e.description) { <div class="text-slate-600">{{ e.description }}</div> }
                </div>
              }
            </section>
          }
        }
        @case ('skills') {
          @if (resume().skills.length) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Skills</h2>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-700">
                @for (s of resume().skills; track s.id) {
                  <span>{{ s.name }}@if (s.level < 5) { <span class="text-slate-400 text-[0.85em]"> · {{ levelLabel(s.level) }}</span> }</span>
                }
              </div>
            </section>
          }
        }
        @case ('projects') {
          @if (resume().projects.length) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Projects</h2>
              @for (p of resume().projects; track p.id) {
                <div class="mb-1.5">
                  <div class="font-semibold">{{ p.name }}@if (p.url) { <span class="text-slate-500 font-normal"> · {{ p.url }}</span> }</div>
                  <div class="text-slate-700">{{ p.description }}</div>
                  @if (p.tech) { <div class="text-slate-500 italic">{{ p.tech }}</div> }
                </div>
              }
            </section>
          }
        }
        @case ('languages') {
          @if (resume().languages.length) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Languages</h2>
              <div class="flex flex-wrap gap-x-3 text-slate-700">
                @for (l of resume().languages; track l.id) {
                  <span>{{ l.name }} <span class="text-slate-500">({{ l.level }})</span></span>
                }
              </div>
            </section>
          }
        }
        @case ('certifications') {
          @if (resume().certifications.length) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Certifications</h2>
              @for (c of resume().certifications; track c.id) {
                <div><span class="font-semibold">{{ c.name }}</span> — <span class="text-slate-600">{{ c.issuer }}{{ c.date ? ' · ' + c.date : '' }}</span></div>
              }
            </section>
          }
        }
        @case ('awards') {
          @if (resume().awards.length) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Awards</h2>
              @for (a of resume().awards; track a.id) {
                <div><span class="font-semibold">{{ a.name }}</span> — <span class="text-slate-600">{{ a.issuer }}{{ a.date ? ' · ' + a.date : '' }}</span></div>
              }
            </section>
          }
        }
        @case ('volunteer') {
          @if (resume().volunteer.length) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Volunteer</h2>
              @for (v of resume().volunteer; track v.id) {
                <div class="mb-1.5">
                  <div class="flex justify-between font-semibold"><span>{{ v.role }} — {{ v.organization }}</span><span class="text-slate-500 font-normal">{{ v.start }} — {{ v.end }}</span></div>
                  @if (v.description) { <div class="text-slate-700">{{ v.description }}</div> }
                </div>
              }
            </section>
          }
        }
        @case ('interests') {
          @if (resume().interests) {
            <section class="sec">
              <h2 class="sec-h" [style.color]="resume().color">Interests</h2>
              <div class="text-slate-700">{{ resume().interests }}</div>
            </section>
          }
        }
      }
    </ng-template>
  `,
  styles: [`
    .resume-shell {
      max-width: 1500px;
      transition: max-width 0.2s ease;
    }
    .resume-shell.fullscreen-mode {
      position: fixed;
      inset: 0;
      max-width: 100vw;
      height: 100vh;
      z-index: 9999;
      background: var(--bg, #fff);
      overflow-y: auto;
      padding-top: 0.5rem !important;
    }
    :host-context(.dark) .resume-shell.fullscreen-mode { --bg: #0f172a; background: #0f172a; }
    .resume-shell.fullscreen-mode .resume-content {
      grid-template-columns: minmax(0, 420px) minmax(0, 1fr) !important;
      height: calc(100vh - 5rem);
    }
    .resume-shell.fullscreen-mode .resume-panel,
    .resume-shell.fullscreen-mode .resume-preview-wrap {
      max-height: calc(100vh - 5rem);
      overflow-y: auto;
    }
    @media (min-width: 1024px) {
      .resume-panel { max-height: calc(100vh - 9rem); overflow-y: auto; padding-right: 0.5rem; }
      .resume-preview-wrap { max-height: calc(100vh - 9rem); overflow-y: auto; }
    }
    .resume-page {
      background: white;
      color: #0f172a;
      width: 210mm;
      min-height: 297mm;
      padding: 18mm;
      box-sizing: border-box;
      overflow: hidden;
    }
    .font-sans { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
    .font-serif { font-family: 'Times New Roman', Georgia, 'Cambria', serif; }
    .font-mono { font-family: ui-monospace, 'JetBrains Mono', 'Menlo', monospace; }
    .density-compact .sec { margin-bottom: 0.6em; }
    .density-compact .sec-h { margin-bottom: 0.25em; }
    .density-normal .sec { margin-bottom: 0.95em; }
    .density-normal .sec-h { margin-bottom: 0.4em; }
    .density-spacious .sec { margin-bottom: 1.4em; }
    .density-spacious .sec-h { margin-bottom: 0.6em; }
    .sec-h {
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.85em;
      padding-bottom: 0.15em;
      border-bottom: 1px solid currentColor;
    }
    .tpl-ats .sec-h { color: #0f172a !important; border-bottom: 1px solid #0f172a; }
    .tpl-tech .sec-h { text-transform: lowercase; letter-spacing: 0; }
    .tpl-tech .sec-h::before { content: '##  '; opacity: 0.5; }
    .tpl-executive .sec-h { text-align: center; border-bottom: none; padding-bottom: 0; border-top: 1px solid currentColor; padding-top: 0.4em; letter-spacing: 0.25em; }
    .tpl-creative .sec-h { border-bottom-width: 2px; }
    .tpl-designer .sec-h { font-size: 1em; padding-bottom: 0.3em; border-bottom-width: 2px; }
    @media print {
      :host, html, body, app-section-header, .no-print, app-navbar, app-footer { display: none !important; }
      #resume-page-root { display: block !important; box-shadow: none !important; margin: 0 !important; }
    }
    @page { size: A4; margin: 0; }
  `],
})
export class ResumeMaker {
  protected templates = TEMPLATES;
  protected colors = COLOR_PRESETS;
  protected tab = signal<'edit' | 'customize' | 'ai'>('edit');
  protected fullscreen = signal(false);
  protected resume = signal<Resume>(this.loadOrDefault());
  protected presets = signal<Preset[]>(this.loadPresets());

  // AI state
  protected ai = inject(AiWriterService);
  protected aiSettings = signal<AiSettings>(this.ai.loadSettings());
  protected aiBusy = signal<string>('');
  protected aiBulletInput = '';
  protected aiBulletOutput = signal('');
  protected aiTargetRole = '';
  protected aiJobDescription = '';
  protected aiTailorOutput = signal('');
  protected atsReport = signal<{ score: number; matched: string[]; missing: string[] } | null>(null);
  protected aiCoverCompany = '';
  protected aiCoverRole = '';
  protected aiCoverOutput = signal('');

  constructor(private toast: ToastService) {
    effect(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.resume())); } catch {}
    });
    effect(() => {
      try { localStorage.setItem(PRESETS_KEY, JSON.stringify(this.presets())); } catch {}
    });
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.fullscreen()) this.fullscreen.set(false);
  }

  toggleFullscreen() {
    this.fullscreen.update(f => !f);
    document.body.style.overflow = this.fullscreen() ? 'hidden' : '';
  }

  private loadOrDefault(): Resume {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_RESUME, ...parsed,
          personal: { ...DEFAULT_RESUME.personal, ...(parsed.personal || {}) },
          awards: parsed.awards ?? [],
          volunteer: parsed.volunteer ?? [],
          interests: parsed.interests ?? '',
          customSections: parsed.customSections ?? [],
        };
      }
    } catch {}
    return structuredClone(DEFAULT_RESUME);
  }

  private loadPresets(): Preset[] {
    try {
      const raw = localStorage.getItem(PRESETS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  protected contactLine = computed(() => {
    const p = this.resume().personal;
    return [p.email, p.phone, p.location, p.website, p.linkedin].filter(Boolean).join(' · ');
  });
  protected templateName = computed(() => this.templates.find(t => t.id === this.resume().template)?.name ?? '');
  protected pageCount = computed(() => {
    // rough heuristic: chars / 3000 ≈ pages
    const r = this.resume();
    const chars = (r.personal.summary?.length || 0)
      + r.experience.reduce((s, e) => s + (e.title?.length || 0) + (e.bullets?.length || 0) + 50, 0)
      + r.education.reduce((s, e) => s + (e.degree?.length || 0) + (e.description?.length || 0) + 30, 0)
      + r.projects.reduce((s, p) => s + (p.name?.length || 0) + (p.description?.length || 0) + 30, 0)
      + r.skills.length * 20
      + r.volunteer.reduce((s, v) => s + (v.role?.length || 0) + (v.description?.length || 0) + 30, 0);
    return Math.max(1, Math.ceil(chars / 2800));
  });

  protected mainKeys = computed(() => this.resume().order.filter(k => ['summary', 'experience', 'projects', 'volunteer', 'awards'].includes(k)));
  protected asideKeys = computed(() => this.resume().order.filter(k => ['skills', 'education', 'languages', 'certifications', 'interests'].includes(k)));

  bulletsOf(s: string): string[] {
    return (s || '').split('\n').map(l => l.trim()).filter(Boolean);
  }
  levelLabel(n: number): string {
    return ['', 'Beginner', 'Familiar', 'Proficient', 'Advanced', 'Expert'][n] || '';
  }
  wordCount(s: string): number {
    return (s || '').trim().split(/\s+/).filter(Boolean).length;
  }
  adjustColor(hex: string, amount: number): string {
    const m = /^#([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return hex;
    const n = parseInt(m[1], 16);
    let r = Math.min(255, ((n >> 16) & 0xff) + amount);
    let g = Math.min(255, ((n >> 8) & 0xff) + amount);
    let b = Math.min(255, (n & 0xff) + amount);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  setField<K extends keyof Resume>(k: K, v: Resume[K]) {
    this.resume.update(r => ({ ...r, [k]: v }));
  }
  updatePersonal(k: keyof Resume['personal'], v: any) {
    this.resume.update(r => ({ ...r, personal: { ...r.personal, [k]: v } }));
  }
  updateItem(section: 'experience' | 'education' | 'skills' | 'projects' | 'languages' | 'certifications' | 'awards' | 'volunteer', i: number, field: string, v: any) {
    this.resume.update(r => {
      const list = [...(r as any)[section]];
      list[i] = { ...list[i], [field]: v };
      return { ...r, [section]: list };
    });
  }
  removeItem(section: 'experience' | 'education' | 'skills' | 'projects' | 'languages' | 'certifications' | 'awards' | 'volunteer', i: number) {
    this.resume.update(r => {
      const list = [...(r as any)[section]];
      list.splice(i, 1);
      return { ...r, [section]: list };
    });
  }
  moveItem(section: 'experience' | 'education' | 'skills' | 'projects' | 'awards' | 'volunteer', i: number, dir: -1 | 1) {
    this.resume.update(r => {
      const list = [...(r as any)[section]];
      const j = i + dir;
      if (j < 0 || j >= list.length) return r;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...r, [section]: list };
    });
  }
  moveSection(i: number, dir: -1 | 1) {
    this.resume.update(r => {
      const order = [...r.order];
      const j = i + dir;
      if (j < 0 || j >= order.length) return r;
      [order[i], order[j]] = [order[j], order[i]];
      return { ...r, order };
    });
  }
  onCurrentToggle(i: number, current: boolean) {
    this.updateItem('experience', i, 'current', current);
    if (current) this.updateItem('experience', i, 'end', 'Present');
    else this.updateItem('experience', i, 'end', '');
  }

  addExperience()    { this.resume.update(r => ({ ...r, experience: [...r.experience, { id: crypto.randomUUID(), title: '', company: '', location: '', start: '', end: '', current: false, bullets: '' }] })); }
  addEducation()     { this.resume.update(r => ({ ...r, education: [...r.education, { id: crypto.randomUUID(), degree: '', school: '', location: '', start: '', end: '', description: '' }] })); }
  addSkill()         { this.resume.update(r => ({ ...r, skills: [...r.skills, { id: crypto.randomUUID(), name: '', level: 3 }] })); }
  addProject()       { this.resume.update(r => ({ ...r, projects: [...r.projects, { id: crypto.randomUUID(), name: '', description: '', url: '', tech: '' }] })); }
  addLanguage()      { this.resume.update(r => ({ ...r, languages: [...r.languages, { id: crypto.randomUUID(), name: '', level: 'Fluent' }] })); }
  addCertification() { this.resume.update(r => ({ ...r, certifications: [...r.certifications, { id: crypto.randomUUID(), name: '', issuer: '', date: '' }] })); }
  addAward()         { this.resume.update(r => ({ ...r, awards: [...r.awards, { id: crypto.randomUUID(), name: '', issuer: '', date: '' }] })); }
  addVolunteer()     { this.resume.update(r => ({ ...r, volunteer: [...r.volunteer, { id: crypto.randomUUID(), role: '', organization: '', start: '', end: '', description: '' }] })); }

  // Custom sections
  addCustomSection() {
    this.resume.update(r => ({ ...r, customSections: [...r.customSections, { id: crypto.randomUUID(), title: 'Untitled section', items: [{ id: crypto.randomUUID(), line1: '', line2: '', description: '' }] }] }));
  }
  removeCustomSection(i: number) {
    this.resume.update(r => { const list = [...r.customSections]; list.splice(i, 1); return { ...r, customSections: list }; });
  }
  updateCustomTitle(i: number, title: string) {
    this.resume.update(r => { const list = [...r.customSections]; list[i] = { ...list[i], title }; return { ...r, customSections: list }; });
  }
  addCustomItem(i: number) {
    this.resume.update(r => { const list = [...r.customSections]; list[i] = { ...list[i], items: [...list[i].items, { id: crypto.randomUUID(), line1: '', line2: '', description: '' }] }; return { ...r, customSections: list }; });
  }
  removeCustomItem(i: number, j: number) {
    this.resume.update(r => { const list = [...r.customSections]; const items = [...list[i].items]; items.splice(j, 1); list[i] = { ...list[i], items }; return { ...r, customSections: list }; });
  }
  updateCustomItem(i: number, j: number, field: 'line1' | 'line2' | 'description', v: string) {
    this.resume.update(r => {
      const list = [...r.customSections];
      const items = [...list[i].items];
      items[j] = { ...items[j], [field]: v };
      list[i] = { ...list[i], items };
      return { ...r, customSections: list };
    });
  }

  // Presets
  savePreset() {
    const name = prompt('Name this style:');
    if (!name?.trim()) return;
    const r = this.resume();
    const p: Preset = { id: crypto.randomUUID(), name: name.trim(), template: r.template, color: r.color, font: r.font, fontSize: r.fontSize, density: r.density };
    this.presets.update(list => [p, ...list]);
    this.toast.success('Style saved');
  }
  applyPreset(p: Preset) {
    this.resume.update(r => ({ ...r, template: p.template, color: p.color, font: p.font, fontSize: p.fontSize, density: p.density }));
    this.toast.success('Style applied');
  }
  removePreset(id: string) {
    this.presets.update(list => list.filter(p => p.id !== id));
  }

  // Photo
  async onPhotoUpload(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.updatePersonal('photo', reader.result as string);
    reader.readAsDataURL(file);
  }

  reset() {
    if (!confirm('Reset the resume to the demo template? This cannot be undone.')) return;
    this.resume.set(structuredClone(DEFAULT_RESUME));
    this.toast.success('Resume reset');
  }

  downloadJson() {
    const blob = new Blob([JSON.stringify(this.resume(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${this.resume().personal.name.replace(/\s+/g, '_') || 'resume'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJson(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        this.resume.set({
          ...DEFAULT_RESUME, ...data,
          personal: { ...DEFAULT_RESUME.personal, ...(data.personal || {}) },
          awards: data.awards ?? [], volunteer: data.volunteer ?? [],
          interests: data.interests ?? '', customSections: data.customSections ?? [],
        });
        this.toast.success('Resume imported');
      } catch {
        this.toast.success('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }

  print() {
    const page = document.getElementById('resume-page-root');
    if (!page) { window.print(); return; }
    const printWin = window.open('', '_blank', 'width=900,height=1000');
    if (!printWin) { window.print(); return; }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(n => n.outerHTML).join('\n');

    printWin.document.write(`<!doctype html><html><head><title>${this.resume().personal.name || 'Resume'}</title>${styles}
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; background: #fff; }
        #wrap { width: 210mm; min-height: 297mm; }
      </style></head><body><div id="wrap">${page.outerHTML}</div></body></html>`);
    printWin.document.close();

    const fire = () => { try { printWin.focus(); printWin.print(); } catch {} };
    if (printWin.document.readyState === 'complete') setTimeout(fire, 250);
    else printWin.addEventListener('load', () => setTimeout(fire, 250));
  }

  copy(s: string) {
    navigator.clipboard.writeText(s).then(() => this.toast.success('Copied'), () => {});
  }

  // === AI ===
  setProvider(p: AiSettings['provider']) {
    const next = { ...this.aiSettings(), provider: p, model: this.ai.defaultModel(p) };
    this.aiSettings.set(next); this.ai.saveSettings(next);
  }
  setKey(k: string) {
    const next = { ...this.aiSettings(), apiKey: k };
    this.aiSettings.set(next); this.ai.saveSettings(next);
  }

  private async runAi(task: string, prompt: string): Promise<string> {
    this.aiBusy.set(task);
    try {
      return (await this.ai.runAi(prompt, this.aiSettings())).trim();
    } finally {
      this.aiBusy.set('');
    }
  }

  private resumeContext(): string {
    const r = this.resume();
    const exp = r.experience.map(e => `${e.title} @ ${e.company} (${e.start}-${e.end || 'Present'}): ${e.bullets}`).join('\n');
    const edu = r.education.map(e => `${e.degree} — ${e.school}`).join('; ');
    const skills = r.skills.map(s => s.name).join(', ');
    return `Name: ${r.personal.name}\nTitle: ${r.personal.title}\nSummary: ${r.personal.summary}\nExperience:\n${exp}\nEducation: ${edu}\nSkills: ${skills}`;
  }

  async aiImproveSummary() {
    if (this.aiBusy()) return;
    const summary = this.resume().personal.summary;
    if (!summary.trim()) { this.toast.success('Summary is empty'); return; }
    try {
      const result = await this.runAi('summary', `Rewrite this professional resume summary to be sharper, more impactful, with strong action verbs and quantified achievements. Keep it to 2-3 sentences and the same first-person/third-person voice. Return ONLY the rewritten summary text, no preamble.

Current summary:
${summary}

Context about the person:
${this.resumeContext()}`);
      this.updatePersonal('summary', result);
      this.toast.success('Summary improved');
    } catch (e: any) {
      this.toast.success('AI error: ' + (e?.message ?? 'try a different provider'));
    }
  }

  async aiGenerateSummary() {
    if (this.aiBusy()) return;
    try {
      const result = await this.runAi('summary', `Write a compelling 2-3 sentence professional resume summary for this candidate. Use strong action verbs and 1-2 quantified achievements. Return ONLY the summary text.

${this.resumeContext()}`);
      this.updatePersonal('summary', result);
      this.toast.success('Summary generated');
    } catch (e: any) {
      this.toast.success('AI error: ' + (e?.message ?? ''));
    }
  }

  async aiImproveBullet() {
    if (this.aiBusy() || !this.aiBulletInput.trim()) return;
    try {
      const result = await this.runAi('improve-bullet', `Rewrite this resume bullet to be more impactful. Use a strong action verb, focus on impact, and add a quantified metric if reasonable. Return ONLY the rewritten bullet, no preamble.

Bullet:
${this.aiBulletInput}`);
      this.aiBulletOutput.set(result);
    } catch (e: any) {
      this.toast.success('AI error: ' + (e?.message ?? ''));
    }
  }

  async aiGenerateBullets() {
    if (this.aiBusy() || !this.aiTargetRole) return;
    const idx = this.resume().experience.findIndex(e => e.id === this.aiTargetRole);
    if (idx < 0) return;
    const e = this.resume().experience[idx];
    try {
      const result = await this.runAi('bullets', `Generate 4 strong resume bullets for someone working as "${e.title}" at "${e.company}". Each bullet starts with a strong action verb and includes a quantified outcome where possible. Return ONLY the 4 bullets, one per line, no numbering, no preamble.`);
      const existing = e.bullets.trim();
      const combined = existing ? existing + '\n' + result : result;
      this.updateItem('experience', idx, 'bullets', combined);
      this.toast.success('Bullets added');
    } catch (err: any) {
      this.toast.success('AI error: ' + (err?.message ?? ''));
    }
  }

  async aiImproveAllBullets(i: number) {
    if (this.aiBusy()) return;
    const e = this.resume().experience[i];
    if (!e.bullets.trim()) { this.toast.success('No bullets to improve'); return; }
    try {
      const result = await this.runAi('bullets', `Rewrite each of these resume bullets to be sharper, use strong action verbs, and add a quantified outcome where reasonable. Keep the same number of bullets and the same order. Return ONLY the bullets, one per line, no numbering.

Bullets:
${e.bullets}`);
      this.updateItem('experience', i, 'bullets', result);
      this.toast.success('Bullets improved');
    } catch (err: any) {
      this.toast.success('AI error: ' + (err?.message ?? ''));
    }
  }

  async aiAddBulletsForJob(i: number) {
    if (this.aiBusy()) return;
    const e = this.resume().experience[i];
    try {
      const result = await this.runAi('bullets', `Generate 3 additional strong resume bullets for someone working as "${e.title}" at "${e.company}". Avoid duplicating these existing bullets:

${e.bullets}

Return ONLY the 3 new bullets, one per line, no numbering.`);
      const combined = e.bullets.trim() ? e.bullets + '\n' + result : result;
      this.updateItem('experience', i, 'bullets', combined);
      this.toast.success('Bullets added');
    } catch (err: any) {
      this.toast.success('AI error: ' + (err?.message ?? ''));
    }
  }

  async aiExtractSkills() {
    if (this.aiBusy()) return;
    try {
      const result = await this.runAi('skills', `Extract the top 8 distinct technical and soft skills implied by this resume. Return ONLY a comma-separated list of skill names, no description.

${this.resumeContext()}`);
      const names = result.split(/[,\n]/).map(s => s.trim()).filter(Boolean).slice(0, 8);
      const existing = new Set(this.resume().skills.map(s => s.name.toLowerCase()));
      const additions = names
        .filter(n => !existing.has(n.toLowerCase()))
        .map(name => ({ id: crypto.randomUUID(), name, level: 4 }));
      if (!additions.length) { this.toast.success('No new skills found'); return; }
      this.resume.update(r => ({ ...r, skills: [...r.skills, ...additions] }));
      this.toast.success(`Added ${additions.length} skill(s)`);
    } catch (err: any) {
      this.toast.success('AI error: ' + (err?.message ?? ''));
    }
  }

  async aiTailorAdvice() {
    if (this.aiBusy() || !this.aiJobDescription.trim()) return;
    try {
      const result = await this.runAi('tailor', `Analyze how well this resume matches the job description. Provide 4-6 concrete, actionable suggestions to better align it (specific bullets to add or rewrite, skills to highlight, keywords to add). Be specific and concise.

JOB DESCRIPTION:
${this.aiJobDescription}

RESUME:
${this.resumeContext()}`);
      this.aiTailorOutput.set(result);
    } catch (err: any) {
      this.toast.success('AI error: ' + (err?.message ?? ''));
    }
  }

  aiAtsAnalyze() {
    if (!this.aiJobDescription.trim()) return;
    this.aiBusy.set('ats');
    try {
      // Local ATS keyword check — no AI needed
      const stop = new Set('the a an and or for of to in on at by with as is are be will we you they our your their them his her ours yours theirs from this that these those have has had do does did was were been being should would could can may might must shall about into through over under above below into onto upon than then so but if not no yes also more most less least very even just only some any all each every few many much such other any not very same own across against between because while where when how why who which what whose'.split(/\s+/));
      const jd = this.aiJobDescription.toLowerCase().replace(/[^a-z0-9\s\-+\/.#]/g, ' ');
      const tokens = jd.split(/\s+/).filter(t => t.length >= 3 && !stop.has(t));
      const freq = new Map<string, number>();
      for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
      // top 25 by frequency
      const keywords = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k]) => k);
      const haystack = (this.resumeContext() + ' ' + this.resume().personal.summary).toLowerCase();
      const matched = keywords.filter(k => haystack.includes(k));
      const missing = keywords.filter(k => !haystack.includes(k));
      const score = Math.round((matched.length / keywords.length) * 100);
      this.atsReport.set({ score, matched, missing });
    } finally {
      this.aiBusy.set('');
    }
  }

  async aiCoverLetter() {
    if (this.aiBusy() || !this.aiCoverCompany.trim() || !this.aiCoverRole.trim()) return;
    try {
      const result = await this.runAi('cover', `Write a professional cover letter (around 250 words) from this candidate applying for the "${this.aiCoverRole}" role at "${this.aiCoverCompany}". Reference 2-3 specific achievements from the resume. Use a confident, warm tone. Include greeting and sign-off.

CANDIDATE:
${this.resumeContext()}`);
      this.aiCoverOutput.set(result);
    } catch (err: any) {
      this.toast.success('AI error: ' + (err?.message ?? ''));
    }
  }
}
