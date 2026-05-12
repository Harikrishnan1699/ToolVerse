import { Injectable } from '@angular/core';

export interface LtMatch {
  offset: number;
  length: number;
  message: string;
  shortMessage?: string;
  rule?: { id?: string; description?: string; issueType?: string; category?: { id?: string; name?: string } };
  replacements: { value: string }[];
}

export type AiProvider = 'free' | 'gemini' | 'groq' | 'openai' | 'anthropic';

export interface AiSettings {
  provider: AiProvider;
  apiKey: string;
  model?: string;
}

const STORAGE_KEY = 'tv.aiWriter.settings.v1';

const DEFAULT_MODELS: Record<AiProvider, string> = {
  free: 'openai',
  gemini: 'gemini-1.5-flash-latest',
  groq: 'llama-3.1-8b-instant',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
};

@Injectable({ providedIn: 'root' })
export class AiWriterService {
  loadSettings(): AiSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { provider: 'free', apiKey: '', model: DEFAULT_MODELS.free };
  }

  needsKey(p: AiProvider): boolean { return p !== 'free'; }

  saveSettings(s: AiSettings) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  }

  defaultModel(p: AiProvider) { return DEFAULT_MODELS[p]; }

  /** LanguageTool free public API — no key required (rate-limited). */
  async grammarCheck(text: string, language = 'en-US'): Promise<LtMatch[]> {
    if (!text.trim()) return [];
    const body = new URLSearchParams();
    body.set('text', text);
    body.set('language', language);
    body.set('enabledOnly', 'false');
    const res = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error(`LanguageTool error ${res.status}`);
    const data = await res.json();
    return (data?.matches ?? []) as LtMatch[];
  }

  applyMatches(text: string, matches: LtMatch[], chosen: Record<number, number>): string {
    const sorted = matches
      .map((m, i) => ({ m, i }))
      .filter(({ i }) => chosen[i] != null && chosen[i] >= 0)
      .sort((a, b) => b.m.offset - a.m.offset);
    let out = text;
    for (const { m, i } of sorted) {
      const replacement = m.replacements[chosen[i]]?.value;
      if (replacement == null) continue;
      out = out.slice(0, m.offset) + replacement + out.slice(m.offset + m.length);
    }
    return out;
  }

  async runAi(prompt: string, settings: AiSettings): Promise<string> {
    const model = settings.model || DEFAULT_MODELS[settings.provider];
    if (settings.provider !== 'free' && !settings.apiKey) throw new Error('No API key configured');

    switch (settings.provider) {
      case 'free':         return this.callPollinations(prompt, model);
      case 'gemini':       return this.callGemini(prompt, settings.apiKey, model);
      case 'groq':         return this.callOpenAiCompat('https://api.groq.com/openai/v1/chat/completions', prompt, settings.apiKey, model);
      case 'openai':       return this.callOpenAiCompat('https://api.openai.com/v1/chat/completions', prompt, settings.apiKey, model);
      case 'anthropic':    return this.callAnthropic(prompt, settings.apiKey, model);
    }
  }

  private async callPollinations(prompt: string, model: string): Promise<string> {
    // Primary: Hack Club AI — free, no key, OpenAI-compatible, CORS-enabled.
    try {
      const text = await this.callHackClub(prompt);
      if (text && !this.isServiceNotice(text)) return text;
    } catch (err) {
      // fall through to backup
    }

    // Fallback: Pollinations anonymous endpoint.
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'openai',
        messages: [
          { role: 'system', content: 'You are a concise writing assistant. Respond with ONLY the rewritten text, no preamble, no quotes, no commentary.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`Free AI ${res.status}: ${await res.text()}`);
    const text = await res.text();
    let content = '';
    try {
      const data = JSON.parse(text);
      content = data?.choices?.[0]?.message?.content ?? data?.text ?? text;
    } catch {
      content = text;
    }
    if (this.isServiceNotice(content)) {
      throw new Error('Free providers are temporarily unavailable — please retry, or pick Gemini / Groq in Settings (both have free tiers).');
    }
    return content;
  }

  private async callHackClub(prompt: string): Promise<string> {
    const res = await fetch('https://ai.hackclub.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are a concise writing assistant. Respond with ONLY the rewritten text, no preamble, no quotes, no commentary.' },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`HackClub ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }

  private isServiceNotice(text: string): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return (
      lower.includes('pollinations legacy') ||
      lower.includes('enter.pollinations.ai') ||
      (lower.includes('important notice') && lower.includes('migrate'))
    );
  }

  private async callGemini(prompt: string, key: string, model: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
  }

  private async callOpenAiCompat(url: string, prompt: string, key: string, model: string): Promise<string> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a concise writing assistant. Respond with ONLY the rewritten text, no preamble, no quotes, no commentary.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? '';
  }

  private async callAnthropic(prompt: string, key: string, model: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: 'You are a concise writing assistant. Respond with ONLY the rewritten text, no preamble, no quotes, no commentary.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data?.content ?? []).map((c: any) => c.text).join('');
  }
}
