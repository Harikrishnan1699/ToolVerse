import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../shared/section-header/section-header';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-email-signature',
  imports: [FormsModule, SectionHeader],
  template: `
    <app-section-header title="Email Signature Generator" subtitle="Build a clean HTML signature — copy and paste into Gmail, Outlook, Apple Mail." icon="✉" color="from-sky-500 to-indigo-600" back="/" backLabel="Home" />
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 grid lg:grid-cols-2 gap-5">

      <div class="card p-5 space-y-3">
        <div class="text-xs font-bold uppercase tracking-widest text-slate-500">Identity</div>
        <div class="grid grid-cols-2 gap-2">
          <input class="input" placeholder="Full name" [(ngModel)]="name" />
          <input class="input" placeholder="Title / role" [(ngModel)]="role" />
        </div>
        <input class="input" placeholder="Company" [(ngModel)]="company" />
        <div class="grid grid-cols-2 gap-2">
          <input class="input" placeholder="Email" [(ngModel)]="email" />
          <input class="input" placeholder="Phone" [(ngModel)]="phone" />
        </div>
        <input class="input" placeholder="Website" [(ngModel)]="website" />
        <input class="input" placeholder="Address (one line)" [(ngModel)]="address" />

        <div class="text-xs font-bold uppercase tracking-widest text-slate-500 pt-2">Social</div>
        <div class="grid grid-cols-2 gap-2">
          <input class="input" placeholder="LinkedIn URL" [(ngModel)]="linkedin" />
          <input class="input" placeholder="GitHub URL" [(ngModel)]="github" />
          <input class="input" placeholder="X / Twitter URL" [(ngModel)]="twitter" />
          <input class="input" placeholder="Instagram URL" [(ngModel)]="instagram" />
        </div>

        <div class="text-xs font-bold uppercase tracking-widest text-slate-500 pt-2">Style</div>
        <div class="grid grid-cols-3 gap-2">
          <div><label class="text-xs">Layout</label>
            <select class="input mt-1 text-sm" [(ngModel)]="layout">
              <option value="left">Left photo</option>
              <option value="top">Photo on top</option>
              <option value="text">Text only</option>
            </select>
          </div>
          <div><label class="text-xs">Accent</label>
            <input type="color" class="mt-1 h-9 w-full rounded-lg" [(ngModel)]="accent" />
          </div>
          <div><label class="text-xs">Avatar URL</label>
            <input class="input mt-1 text-sm" placeholder="https://…" [(ngModel)]="avatar" />
          </div>
        </div>
        <input class="input text-sm" placeholder="Tagline / disclaimer (optional)" [(ngModel)]="tagline" />
      </div>

      <div class="card p-5 lg:sticky lg:top-20">
        <div class="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Preview</div>
        <div class="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-white overflow-auto">
          <div [innerHTML]="sigHtml()"></div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button class="btn-primary text-sm" (click)="copyRich()">📋 Copy as signature</button>
          <button class="btn-secondary text-sm" (click)="copyHtml()">Copy HTML</button>
        </div>
        <p class="text-xs text-slate-500 mt-3">In Gmail / Outlook / Apple Mail: open Settings → Signature → paste. Use "Copy as signature" to keep formatting; HTML if your client has a source view.</p>
      </div>
    </section>
  `,
})
export class EmailSignature {
  protected name = 'Alex Morgan';
  protected role = 'Product Designer';
  protected company = 'Acme Studio';
  protected email = 'alex@acme.com';
  protected phone = '+1 555 0100';
  protected website = 'acme.com';
  protected address = '123 Pine Street, Brooklyn, NY';
  protected linkedin = 'https://linkedin.com/in/alex';
  protected github = '';
  protected twitter = '';
  protected instagram = '';
  protected layout: 'left' | 'top' | 'text' = 'left';
  protected accent = '#6366f1';
  protected avatar = 'https://i.pravatar.cc/96?img=15';
  protected tagline = '';

  constructor(private toast: ToastService) {}

  protected sigHtml = computed(() => this.build());

  private build(): string {
    const a = this.accent;
    const social = [
      this.linkedin && { url: this.linkedin, label: 'LinkedIn' },
      this.github && { url: this.github, label: 'GitHub' },
      this.twitter && { url: this.twitter, label: 'X' },
      this.instagram && { url: this.instagram, label: 'Instagram' },
    ].filter(Boolean) as { url: string; label: string }[];

    const socialHtml = social.length
      ? `<div style="margin-top:6px;font-size:12px;">${social.map(s => `<a href="${s.url}" style="color:${a};text-decoration:none;margin-right:8px;">${s.label}</a>`).join('·&nbsp;')}</div>`
      : '';

    const body = `
      <div style="font-weight:700;color:#0f172a;font-size:16px;">${this.name}</div>
      <div style="color:#64748b;font-size:13px;">${this.role}${this.role && this.company ? ' · ' : ''}<span style="color:${a};font-weight:600;">${this.company}</span></div>
      <div style="margin-top:8px;font-size:13px;color:#334155;line-height:1.6;">
        ${this.email ? `<div>📧 <a href="mailto:${this.email}" style="color:#334155;text-decoration:none;">${this.email}</a></div>` : ''}
        ${this.phone ? `<div>📱 <a href="tel:${this.phone}" style="color:#334155;text-decoration:none;">${this.phone}</a></div>` : ''}
        ${this.website ? `<div>🌐 <a href="https://${this.website.replace(/^https?:\/\//, '')}" style="color:${a};text-decoration:none;">${this.website}</a></div>` : ''}
        ${this.address ? `<div style="color:#64748b;">📍 ${this.address}</div>` : ''}
      </div>
      ${socialHtml}
      ${this.tagline ? `<div style="margin-top:8px;font-size:11px;color:#94a3b8;font-style:italic;">${this.tagline}</div>` : ''}
    `;

    if (this.layout === 'text') {
      return `<table cellpadding="0" cellspacing="0" style="font-family:Helvetica,Arial,sans-serif;border-left:3px solid ${a};padding-left:14px;"><tr><td>${body}</td></tr></table>`;
    }
    if (this.layout === 'top') {
      const img = this.avatar ? `<img src="${this.avatar}" width="72" height="72" style="border-radius:9999px;display:block;margin-bottom:10px;" />` : '';
      return `<table cellpadding="0" cellspacing="0" style="font-family:Helvetica,Arial,sans-serif;"><tr><td>${img}${body}</td></tr></table>`;
    }
    // left
    const img = this.avatar ? `<img src="${this.avatar}" width="72" height="72" style="border-radius:9999px;display:block;" />` : '';
    return `<table cellpadding="0" cellspacing="0" style="font-family:Helvetica,Arial,sans-serif;"><tr>
      <td style="padding-right:14px;border-right:3px solid ${a};">${img}</td>
      <td style="padding-left:14px;">${body}</td>
    </tr></table>`;
  }

  async copyHtml() {
    try { await navigator.clipboard.writeText(this.sigHtml()); this.toast.success('HTML copied'); } catch {}
  }
  async copyRich() {
    try {
      const blob = new Blob([this.sigHtml()], { type: 'text/html' });
      const text = new Blob([this.name + ' — ' + this.role + ', ' + this.company], { type: 'text/plain' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob, 'text/plain': text })]);
      this.toast.success('Signature copied');
    } catch {
      this.copyHtml();
    }
  }
}
